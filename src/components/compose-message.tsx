import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import type { Business, EmailTemplate } from "@/lib/types";
import { generateEmail, generateSMS, generateFollowUp } from "@/lib/messages";
import { api } from "@/lib/api";

interface ComposeMessageProps {
  business: Business;
  onUpdate: (id: string, updates: Partial<Business>) => void;
  onAddHistory: (id: string, action: string) => void;
}

function applyTemplateVars(text: string, b: Business): string {
  return text
    .replace(/\{\{nom\}\}/gi, b.name)
    .replace(/\{\{url\}\}/gi, b.url)
    .replace(/\{\{secteur\}\}/gi, b.sector)
    .replace(/\{\{issues\}\}/gi, b.issues.slice(0, 5).map((i) => `- ${i}`).join("\n"))
    .replace(/\{\{improvements\}\}/gi, b.improvements.slice(0, 5).map((i) => `- ${i}`).join("\n"))
    .replace(/\{\{valeur\}\}/gi, b.estimatedValue);
}

export function ComposeMessage({
  business,
  onUpdate,
  onAddHistory,
}: ComposeMessageProps) {
  const [composeType, setComposeType] = useState<"email" | "sms" | "followup">("email");
  const [copied, setCopied] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | "">("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplSubject, setNewTplSubject] = useState("");
  const [newTplBody, setNewTplBody] = useState("");

  useEffect(() => {
    api.getEmailTemplates().then(setTemplates).catch(() => {});
  }, []);

  const getMessage = () => {
    if (selectedTemplate) {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      if (tpl) return applyTemplateVars(tpl.body, business);
    }
    return composeType === "email"
      ? generateEmail(business)
      : composeType === "sms"
        ? generateSMS(business)
        : generateFollowUp(business);
  };

  const getSubject = () => {
    if (selectedTemplate) {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      if (tpl?.subject) return applyTemplateVars(tpl.subject, business);
    }
    return "";
  };

  const copyMsg = () => {
    const text = getMessage();
    const subject = getSubject();
    const fullText = subject ? `Objet: ${subject}\n\n${text}` : text;
    navigator.clipboard?.writeText(fullText);
    onAddHistory(business.id, `Message ${selectedTemplate ? "template" : composeType} copié`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTemplate = async () => {
    if (!newTplName || !newTplBody) return;
    const tpl = await api.createEmailTemplate({ name: newTplName, subject: newTplSubject, body: newTplBody });
    setTemplates((prev) => [tpl, ...prev]);
    setNewTplName("");
    setNewTplSubject("");
    setNewTplBody("");
  };

  const handleDeleteTemplate = async (id: number) => {
    await api.deleteEmailTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplate === id) setSelectedTemplate("");
  };

  return (
    <div className="max-w-[800px] animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Message
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Pour : {business.name}
      </p>

      {/* Template selector */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value ? parseInt(e.target.value) : "")}
          className="h-8 text-sm rounded border border-border bg-card px-2 flex-1 max-w-xs"
        >
          <option value="">— Pas de template —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowTemplateManager(!showTemplateManager)}
        >
          {showTemplateManager ? "Fermer" : "Gérer"}
        </button>
      </div>

      {/* Template manager */}
      {showTemplateManager && (
        <Card className="mb-5 shadow-sm border-0 border-l-[3px] border-l-amber-500/30">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
              Gérer les templates
            </div>
            <div className="space-y-2 mb-4">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{t.name}</span>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-sm text-muted-foreground/50">Aucun template</div>
              )}
            </div>
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground mb-2">
              Variables: {"{{nom}}"}, {"{{url}}"}, {"{{secteur}}"}, {"{{issues}}"}, {"{{improvements}}"}, {"{{valeur}}"}
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Nom du template"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Objet (optionnel)"
                value={newTplSubject}
                onChange={(e) => setNewTplSubject(e.target.value)}
                className="h-8 text-sm"
              />
              <Textarea
                placeholder="Corps du message..."
                value={newTplBody}
                onChange={(e) => setNewTplBody(e.target.value)}
                className="text-sm min-h-[80px] resize-y"
              />
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleCreateTemplate} disabled={!newTplName || !newTplBody}>
                Créer template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedTemplate && (
        <div className="inline-flex gap-1 p-1 bg-muted/60 rounded-lg mb-5">
          {(
            [
              ["email", "Email"],
              ["sms", "SMS"],
              ["followup", "Relance"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={`text-sm px-4 py-1.5 rounded-md transition-all duration-150 ${
                composeType === k
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setComposeType(k)}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <Card className="mb-5 shadow-sm border-0">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              À :{" "}
              <span className="text-foreground font-medium">
                {composeType === "sms" && !selectedTemplate ? business.phone : business.email}
              </span>
            </div>
            <Button
              variant={copied ? "default" : "outline"}
              className={`text-sm h-9 transition-all duration-200 ${
                copied ? "shadow-sm shadow-primary/20" : ""
              }`}
              onClick={copyMsg}
            >
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
          {getSubject() && (
            <div className="text-sm text-muted-foreground mb-2">
              Objet : <span className="text-foreground">{getSubject()}</span>
            </div>
          )}
          <pre className="bg-muted/40 p-5 rounded-lg text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap break-words max-h-[500px] overflow-auto border border-border/50">
            {getMessage()}
          </pre>
        </CardContent>
      </Card>

      <Separator className="my-5" />

      <div className="flex gap-2.5 flex-wrap">
        <Button
          variant="outline"
          className="text-sm h-9 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          onClick={() => {
            onUpdate(business.id, { status: "contacted" });
            onAddHistory(
              business.id,
              `Email envoyé à ${business.email}`,
            );
          }}
        >
          Marquer contacté
        </Button>
        {business.hasDemo && (
          <Button
            variant="outline"
            className="text-sm h-9 text-amber-600 border-amber-600/20 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all duration-200"
            onClick={() => {
              onUpdate(business.id, { status: "demo_sent" });
              onAddHistory(business.id, "Démo envoyée");
            }}
          >
            Démo envoyée
          </Button>
        )}
      </div>
    </div>
  );
}
