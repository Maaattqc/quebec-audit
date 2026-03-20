import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronDown, Copy, Check, RefreshCw, Loader2, Download, Trash2, Upload, Paperclip, Archive, ArchiveRestore } from "lucide-react";
import type { Business, ChecklistItems, CategoryKey, Reminder, Attachment, Email as EmailType } from "@/lib/types";
import { STATUSES, GRADES, CATEGORIES } from "@/lib/types";
import { api } from "@/lib/api";
import { generatePrompt } from "@/lib/prompt-template";

interface BusinessDetailProps {
  business: Business;
  onUpdate: (id: string, updates: Partial<Business>) => void;
  onAddHistory: (id: string, action: string) => void;
  onCompose: () => void;
}

const CHECKLIST_GROUPS = [
  {
    title: "Contenu",
    items: [
      { key: "contenu_telephones", label: "Numéros de téléphone corrects" },
      { key: "contenu_adresse", label: "Adresse exacte" },
      { key: "contenu_licence", label: "Numéro RBQ/licence correct" },
      { key: "contenu_noms", label: "Noms employés/propriétaires corrects" },
      { key: "contenu_services", label: "Services listés existent vraiment" },
      { key: "contenu_horaires", label: "Heures d'ouverture correctes" },
      { key: "contenu_email", label: "Email correct" },
      { key: "contenu_stats", label: "Aucune statistique inventée" },
      { key: "contenu_temoignages", label: "Témoignages identifiés comme exemples" },
      { key: "contenu_reseaux", label: "Liens réseaux sociaux valides" },
    ],
  },
  {
    title: "Responsive",
    items: [
      { key: "responsive_mobile", label: "Mobile 375px testé" },
      { key: "responsive_hamburger", label: "Menu hamburger fonctionne" },
      { key: "responsive_hero", label: "Hero lisible sur mobile" },
      { key: "responsive_formulaire", label: "Formulaire utilisable au pouce" },
      { key: "responsive_scroll", label: "Aucun scroll horizontal" },
      { key: "responsive_tablette", label: "Tablette portrait et paysage OK" },
      { key: "responsive_desktop", label: "Desktop 1920px OK" },
    ],
  },
  {
    title: "Fonctionnel",
    items: [
      { key: "fonctionnel_telephone", label: "Bouton téléphone ouvre l'appel" },
      { key: "fonctionnel_email", label: "Lien email ouvre le client mail" },
      { key: "fonctionnel_ancres", label: "Ancres scrollent au bon endroit" },
      { key: "fonctionnel_formulaire", label: "Formulaire affiche Merci" },
      { key: "fonctionnel_nav_scroll", label: "Nav change au scroll" },
      { key: "fonctionnel_animations", label: "Animations au scroll correctes" },
      { key: "fonctionnel_compteurs", label: "Compteurs s'animent" },
      { key: "fonctionnel_select", label: "Select type de projet fonctionne" },
    ],
  },
  {
    title: "Visuel",
    items: [
      { key: "visuel_contraste", label: "Aucun texte gris illisible" },
      { key: "visuel_fonts", label: "Google Fonts bien chargées" },
      { key: "visuel_video", label: "Vidéo/image de fond se charge" },
      { key: "visuel_image", label: "Image À propos se charge" },
      { key: "visuel_broken", label: "Pas d'images cassées" },
      { key: "visuel_hover", label: "Hover states fonctionnent" },
      { key: "visuel_marquee", label: "Marquee défile sans saccade" },
      { key: "visuel_overlap", label: "Aucun élément overlap" },
      { key: "visuel_vitesse", label: "Site chargé en moins de 3s" },
    ],
  },
];

const TOTAL_ITEMS = CHECKLIST_GROUPS.reduce((a, g) => a + g.items.length, 0);

export function BusinessDetail({
  business,
  onUpdate,
  onAddHistory,
  onCompose,
}: BusinessDetailProps) {
  const gradeInfo = GRADES[business.grade as keyof typeof GRADES] || {};
  const [checklist, setChecklist] = useState<ChecklistItems>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [promptText, setPromptText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Demo notes editing
  const [demoNotes, setDemoNotes] = useState(business.demoNotes || "");
  const [hasDemo, setHasDemo] = useState(business.hasDemo);

  // Reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");

  // Emails
  const [emails, setEmails] = useState<EmailType[]>([]);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getChecklist(business.id).then(setChecklist).catch(() => setChecklist({}));
    api.getReminders(business.id).then(setReminders).catch(() => setReminders([]));
    api.getEmails({ businessId: business.id }).then(setEmails).catch(() => setEmails([]));
    api.getAttachments(business.id).then(setAttachments).catch(() => setAttachments([]));
    setPromptText("");
    setPromptCopied(false);
    setConfirmArchive(false);
    setDemoNotes(business.demoNotes || "");
    setHasDemo(business.hasDemo);
  }, [business.id]);

  // Sync demo state when business prop changes
  useEffect(() => {
    setDemoNotes(business.demoNotes || "");
    setHasDemo(business.hasDemo);
  }, [business.demoNotes, business.hasDemo]);

  const handleCheckChange = useCallback(
    (key: string, checked: boolean) => {
      setChecklist((prev) => ({ ...prev, [key]: checked }));
      api.updateChecklist(business.id, key, checked);
    },
    [business.id],
  );

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const handleGeneratePrompt = () => {
    const text = generatePrompt(business);
    setPromptText(text);
    onAddHistory(business.id, "Prompt démo généré");
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(promptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleRescan = async () => {
    setRescanning(true);
    try {
      const updated = await api.rescanBusiness(business.id);
      onUpdate(business.id, updated);
    } catch { /* ignore */ }
    setRescanning(false);
  };

  const handleDemoNotesBlur = () => {
    if (demoNotes !== (business.demoNotes || "")) {
      onUpdate(business.id, { demoNotes });
    }
  };

  const handleHasDemoToggle = (checked: boolean) => {
    setHasDemo(checked);
    onUpdate(business.id, { hasDemo: checked });
    onAddHistory(business.id, checked ? "Démo marquée prête" : "Démo retirée");
  };

  // Reminders
  const handleAddReminder = async () => {
    if (!reminderDate) return;
    const r = await api.createReminder({ businessId: business.id, dueDate: reminderDate, note: reminderNote });
    setReminders((prev) => [...prev, r].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
    setReminderDate("");
    setReminderNote("");
  };

  const handleToggleReminder = async (id: number, done: boolean) => {
    await api.updateReminder(id, { done });
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, done } : r));
  };

  const handleDeleteReminder = async (id: number) => {
    await api.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Fichier trop gros (max 5MB)"); return; }
    setUploading(true);
    try {
      const att = await api.uploadAttachment(business.id, file);
      setAttachments((prev) => [att, ...prev]);
    } catch { /* ignore */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = async (id: number) => {
    await api.deleteAttachment(id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
              style={{ background: gradeInfo.color }}
            >
              {business.grade}
            </div>
            {business.score != null && (
              <span className="text-lg font-bold tabular-nums" style={{ color: gradeInfo.color }}>
                {business.score}<span className="text-sm font-normal text-muted-foreground">/100</span>
              </span>
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {business.name}
              </h2>
              <div className="flex gap-2 items-center text-sm">
                <span className="text-muted-foreground">{business.sector}</span>
                <span className="text-muted-foreground/30">·</span>
                <a
                  href={business.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {business.url}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-sm h-9"
            onClick={handleRescan}
            disabled={rescanning}
          >
            {rescanning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Re-auditer
          </Button>
          <Button variant="outline" className="text-sm h-9" asChild>
            <a href={business.url} target="_blank" rel="noreferrer">
              Voir site
            </a>
          </Button>
          {business.status === "archived" ? (
            <Button
              variant="outline"
              className="text-sm h-9 text-emerald-600 border-emerald-600/20 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200"
              onClick={() => {
                onUpdate(business.id, { status: "prospect" });
                onAddHistory(business.id, "Entreprise restaurée");
              }}
            >
              <ArchiveRestore className="w-4 h-4 mr-1" />
              Restaurer
            </Button>
          ) : confirmArchive ? (
            <span className="inline-flex items-center gap-1.5 animate-in fade-in-0 slide-in-from-right-1 duration-200">
              <span className="text-xs text-muted-foreground">Archiver ?</span>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-3"
                onClick={() => {
                  onUpdate(business.id, { status: "archived" });
                  onAddHistory(business.id, "Entreprise archivée");
                  setConfirmArchive(false);
                }}
              >
                Oui
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-3"
                onClick={() => setConfirmArchive(false)}
              >
                Non
              </Button>
            </span>
          ) : (
            <Button
              variant="outline"
              className="text-sm h-9 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              onClick={() => setConfirmArchive(true)}
            >
              <Archive className="w-4 h-4 mr-1" />
              Archiver
            </Button>
          )}
          <Button className="text-sm h-9 shadow-sm shadow-primary/20" onClick={onCompose}>
            Contacter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
              Statut
            </div>
            <Select
              value={business.status}
              onValueChange={(v) => {
                onUpdate(business.id, { status: v as Business["status"] });
                onAddHistory(business.id, `Statut → ${STATUSES[v as keyof typeof STATUSES]?.label}`);
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
              Valeur estimée
            </div>
            <div className="text-xl font-semibold text-foreground">
              {business.estimatedValue}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
              Démo
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={hasDemo}
                onCheckedChange={(checked) => handleHasDemoToggle(!!checked)}
              />
              <span className={`text-sm font-medium ${hasDemo ? "text-amber-600" : "text-muted-foreground/50"}`}>
                {hasDemo ? "Prête" : "Pas encore"}
              </span>
            </div>
            <Textarea
              value={demoNotes}
              onChange={(e) => setDemoNotes(e.target.value)}
              onBlur={handleDemoNotesBlur}
              placeholder="Notes de démo..."
              className="text-sm min-h-[60px] resize-y border-muted bg-muted/30 focus:bg-card transition-colors"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
            Contacts
          </div>
          <div className="flex gap-4 items-center text-base mb-2.5 flex-wrap text-foreground">
            <span>{business.email}</span>
            <span className="text-muted-foreground/30">·</span>
            <span>{business.phone}</span>
          </div>
          {business.contacts.map((c, i) => (
            <div key={i} className="text-sm text-muted-foreground mb-1">
              {c.name} ({c.role}) — {c.phone}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emails section */}
      {emails.length > 0 && (
        <Card className="mb-4 shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
              Emails ({emails.length})
            </div>
            <div className="space-y-1">
              {emails.slice(0, 10).map((email) => {
                const isIncoming = email.direction === "received";
                const isExpanded = expandedEmail === email.id;
                return (
                  <div key={email.id}>
                    <button
                      onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isIncoming ? "bg-blue-500" : "bg-emerald-500"}`} />
                      <span className="text-sm text-foreground/80 truncate flex-1">
                        {email.subject || "(sans objet)"}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(email.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="mx-3 mb-2 p-3 bg-muted/30 rounded-md text-sm">
                        <div className="text-xs text-muted-foreground mb-2">
                          {isIncoming ? "De" : "À"} : {isIncoming ? email.from : email.to}
                        </div>
                        {email.bodyHtml ? (
                          <div className="text-foreground/80 text-sm" dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
                        ) : (
                          <pre className="text-foreground/80 text-sm whitespace-pre-wrap">{email.bodyText || "(vide)"}</pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {business.categoryScores && Object.keys(business.categoryScores).length > 0 && (
        <Card className="mb-4 shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium">
              Audit par catégorie
            </div>
            <div className="space-y-3">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
                const cat = CATEGORIES[key];
                const val = business.categoryScores?.[key] ?? 0;
                const pct = (val / cat.max) * 100;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 shrink-0">{cat.label}</span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-12 text-right" style={{ color: cat.color }}>
                      {val}/{cat.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Card className="shadow-sm border-0 border-l-[3px] border-l-destructive/30">
          <CardContent className="p-5">
            <div className="text-xs text-destructive tracking-wider uppercase font-semibold mb-3">
              Problèmes ({business.issues.length})
            </div>
            {business.categoryIssues && Object.keys(business.categoryIssues).length > 0 ? (
              (Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
                const catIssues = business.categoryIssues?.[key] || [];
                if (catIssues.length === 0) return null;
                const cat = CATEGORIES[key];
                return (
                  <div key={key} className="mb-3">
                    <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </div>
                    {catIssues.map((issue, i) => (
                      <div key={i} className="text-sm text-muted-foreground mb-1.5 flex gap-2.5 leading-relaxed ml-3.5">
                        <span className="text-destructive/50 shrink-0">—</span>
                        {issue}
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              business.issues.map((issue, i) => (
                <div key={i} className="text-sm text-muted-foreground mb-2 flex gap-2.5 leading-relaxed">
                  <span className="text-destructive/50 shrink-0">—</span>
                  {issue}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 border-l-[3px] border-l-emerald-500/30">
          <CardContent className="p-5">
            <div className="text-xs text-emerald-600 tracking-wider uppercase font-semibold mb-3">
              Améliorations ({business.improvements.length})
            </div>
            {business.improvements.map((imp, i) => (
              <div key={i} className="text-sm text-muted-foreground mb-2 flex gap-2.5 leading-relaxed">
                <span className="text-emerald-500 shrink-0">+</span>
                {imp}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
            Notes
          </div>
          <Textarea
            value={business.notes || ""}
            onChange={(e) => onUpdate(business.id, { notes: e.target.value })}
            placeholder="Ajouter des notes..."
            className="text-base min-h-[100px] resize-y border-muted bg-muted/30 focus:bg-card transition-colors"
          />
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card className="mb-4 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
            Rappels ({reminders.filter((r) => !r.done).length})
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="h-8 text-sm w-40"
            />
            <Input
              placeholder="Note..."
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddReminder} disabled={!reminderDate}>
              Ajouter
            </Button>
          </div>
          {reminders.length > 0 && (
            <div className="space-y-1.5">
              {reminders.map((r) => {
                const isOverdue = !r.done && r.dueDate < today;
                const isToday = !r.done && r.dueDate === today;
                return (
                  <div key={r.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={r.done}
                      onCheckedChange={(checked) => handleToggleReminder(r.id, !!checked)}
                    />
                    <span className={`text-xs tabular-nums ${isOverdue ? "text-destructive font-medium" : isToday ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                      {r.dueDate}
                    </span>
                    <span className={`flex-1 ${r.done ? "line-through text-muted-foreground/50" : "text-foreground"}`}>
                      {r.note || "—"}
                    </span>
                    <button onClick={() => handleDeleteReminder(r.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="mb-4 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground tracking-wider uppercase font-medium">
              Fichiers ({attachments.length})
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Ajouter
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          </div>
          {attachments.length > 0 ? (
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 text-sm">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-foreground truncate">{att.filename}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{(att.sizeBytes / 1024).toFixed(0)}KB</span>
                  <a href={api.downloadAttachmentUrl(att.id)} className="text-primary hover:text-primary/80 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleDeleteAttachment(att.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/40">Aucun fichier</div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs text-muted-foreground tracking-wider uppercase font-medium">
              Checklist pre-pitch
            </div>
            <span className="text-xs text-muted-foreground">
              {checkedCount}/{TOTAL_ITEMS} vérifié
            </span>
          </div>
          <div className="space-y-1">
            {CHECKLIST_GROUPS.map((group) => (
              <div key={group.title}>
                <button
                  className="flex items-center gap-2 w-full text-left text-sm font-medium text-foreground py-2 hover:text-primary transition-colors"
                  onClick={() => toggleGroup(group.title)}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      openGroups[group.title] ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  {group.title} ({group.items.filter((it) => checklist[it.key]).length}/{group.items.length})
                </button>
                {openGroups[group.title] && (
                  <div className="ml-6 space-y-2 pb-2">
                    {group.items.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox
                          checked={!!checklist[item.key]}
                          onCheckedChange={(checked) => handleCheckChange(item.key, !!checked)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
            Générer prompt démo
          </div>
          <Button variant="outline" className="text-sm h-9 mb-3" onClick={handleGeneratePrompt}>
            Générer le prompt
          </Button>
          {promptText && (
            <div>
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={handleCopyPrompt}>
                  {promptCopied ? (<><Check className="w-3 h-3" /> Copié</>) : (<><Copy className="w-3 h-3" /> Copier</>)}
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-4 overflow-auto max-h-[400px] whitespace-pre-wrap">
                {promptText}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
            Historique
          </div>
          {(business.history || []).length === 0 && (
            <div className="text-sm text-muted-foreground/40">Aucune activité</div>
          )}
          <div className="space-y-2.5">
            {(business.history || []).map((h, i) => (
              <div key={i} className="flex gap-3 text-sm items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-border mt-2 shrink-0" />
                <div className="flex-1">
                  <span className="text-muted-foreground">{h.action}</span>
                  <span className="text-muted-foreground/50 ml-2 text-xs">{h.ts}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
