import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Business } from "@/lib/data";
import { STATUSES, GRADES, INITIAL_BUSINESSES, generateEmail, generateSMS, generateFollowUp } from "@/lib/data";

type Tab = "pipeline" | "detail" | "compose" | "addNew";

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [selectedId, setSelectedId] = useState("lapointe");
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [filterStatus, setFilterStatus] = useState("all");
  const [composeType, setComposeType] = useState<"email" | "sms" | "followup">("email");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: "", url: "", sector: "", phone: "", email: "", grade: "C", notes: "" });

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem("quebec-hub-data");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.businesses?.length > 0) {
          setBusinesses(parsed.businesses);
          if (parsed.selectedId) setSelectedId(parsed.selectedId);
        }
      }
    } catch (e) { /* use defaults */ }
  }, []);

  // Save
  const save = useCallback((data: Business[]) => {
    setSaving(true);
    try { localStorage.setItem("quebec-hub-data", JSON.stringify({ businesses: data, selectedId })); } catch {}
    setTimeout(() => setSaving(false), 400);
  }, [selectedId]);

  useEffect(() => { save(businesses); }, [businesses, save]);

  const selected = businesses.find((b) => b.id === selectedId) || businesses[0];
  const filtered = filterStatus === "all" ? businesses : businesses.filter((b) => b.status === filterStatus);

  const updateBiz = (id: string, updates: Partial<Business>) => {
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const addHistory = (id: string, action: string) => {
    const ts = new Date().toLocaleString("fr-CA");
    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, history: [{ ts, action }, ...(b.history || [])] } : b));
  };

  const copyMsg = () => {
    const text = composeType === "email" ? generateEmail(selected) : composeType === "sms" ? generateSMS(selected) : generateFollowUp(selected);
    navigator.clipboard?.writeText(text);
    addHistory(selected.id, `Message ${composeType} copié`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addNewBusiness = () => {
    if (!newBiz.name) return;
    const id = newBiz.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const entry: Business = {
      ...newBiz, id, contacts: [], status: "prospect", issues: [], improvements: [],
      estimatedValue: "À estimer", hasDemo: false, demoNotes: "",
      history: [{ ts: new Date().toLocaleString("fr-CA"), action: "Entreprise ajoutée" }],
    };
    setBusinesses((prev) => [...prev, entry]);
    setSelectedId(id);
    setActiveTab("detail");
    setNewBiz({ name: "", url: "", sector: "", phone: "", email: "", grade: "C", notes: "" });
  };

  const totalValue = businesses.reduce((a, b) => {
    const match = (b.estimatedValue || "").match(/[\d\s]+/);
    return a + (match ? parseInt(match[0].replace(/\s/g, "")) : 0);
  }, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "pipeline", label: "📊 Pipeline" },
    { key: "detail", label: "🔍 Détail" },
    { key: "compose", label: "✉ Message" },
    { key: "addNew", label: "➕ Ajouter" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-[300px] bg-[hsl(240,5%,7%)] border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">B</div>
            <div>
              <div className="text-sm font-bold text-white">Québec Web Audit</div>
              <div className="text-[10px] text-indigo-400 tracking-widest">HUB DE PROSPECTION</div>
            </div>
          </div>
          {/* Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous ({businesses.length})</SelectItem>
              {Object.entries(STATUSES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label} ({businesses.filter((b) => b.status === k).length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filtered.map((b) => {
              const gr = GRADES[b.grade] || GRADES.C;
              const st = STATUSES[b.status] || STATUSES.prospect;
              const isActive = b.id === selectedId;
              return (
                <button key={b.id} onClick={() => { setSelectedId(b.id); if (activeTab === "addNew") setActiveTab("detail"); }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${isActive ? "bg-indigo-500/10 border border-indigo-500/20" : "border border-transparent hover:bg-secondary/50"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[13px] font-semibold ${isActive ? "text-white" : "text-zinc-300"}`}>{b.name}</span>
                    <span className="text-lg font-extrabold leading-none" style={{ color: gr.color }}>{b.grade}</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium border-0" style={{ color: st.color, backgroundColor: st.color + "18" }}>{st.label}</Badge>
                    <span className="text-[11px] text-zinc-600">{b.sector}</span>
                  </div>
                  {b.hasDemo && <span className="text-[10px] text-purple-400 mt-1 block">✦ Démo prête</span>}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Add button */}
        <div className="p-3 border-t border-border">
          <Button variant="secondary" className="w-full text-xs h-9" onClick={() => setActiveTab("addNew")}>+ Ajouter une entreprise</Button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 px-5 border-b border-border flex items-center justify-between bg-[hsl(240,5%,7%)] shrink-0">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <Button key={t.key} variant="ghost" size="sm"
                className={`text-xs h-8 px-3 ${activeTab === t.key ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setActiveTab(t.key)}>{t.label}</Button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-600">{saving ? "💾 Sauvegarde..." : "✓ Sauvegardé"}</span>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-[1000px]">

            {/* ─── PIPELINE ─── */}
            {activeTab === "pipeline" && (
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Pipeline de vente</h2>
                <p className="text-xs text-zinc-500 mb-6">{businesses.length} entreprises · Valeur totale : {totalValue.toLocaleString()}$+</p>
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {Object.entries(STATUSES).map(([sk, si]) => {
                    const items = businesses.filter((b) => b.status === sk);
                    return (
                      <div key={sk} className="min-w-[200px] flex-1">
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: si.color }} />
                          <span className="text-xs font-semibold" style={{ color: si.color }}>{si.label}</span>
                          <span className="text-[11px] text-zinc-600 ml-auto">{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((b) => (
                            <button key={b.id} onClick={() => { setSelectedId(b.id); setActiveTab("detail"); }}
                              className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-zinc-700 transition-colors">
                              <div className="flex justify-between mb-1">
                                <span className="text-[13px] font-semibold text-zinc-200">{b.name}</span>
                                <span className="text-sm font-extrabold" style={{ color: (GRADES[b.grade] || {}).color }}>{b.grade}</span>
                              </div>
                              <div className="text-[11px] text-zinc-500">{b.estimatedValue}</div>
                              {b.hasDemo && <div className="text-[10px] text-purple-400 mt-1">✦ Démo prête</div>}
                            </button>
                          ))}
                          {items.length === 0 && (
                            <div className="p-5 text-center text-xs text-zinc-700 border border-dashed border-zinc-800 rounded-lg">Aucune</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── DETAIL ─── */}
            {activeTab === "detail" && selected && (
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl font-extrabold" style={{ color: (GRADES[selected.grade] || {}).color }}>{selected.grade}</span>
                      <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                    </div>
                    <div className="flex gap-2 items-center text-xs">
                      <span className="text-zinc-500">{selected.sector}</span>
                      <span className="text-zinc-700">·</span>
                      <a href={selected.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{selected.url}</a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="text-xs h-8" asChild>
                      <a href={selected.url} target="_blank" rel="noreferrer">Voir site ↗</a>
                    </Button>
                    <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700" onClick={() => setActiveTab("compose")}>✉ Contacter</Button>
                  </div>
                </div>

                {/* Status / Value / Demo */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-2">Statut</div>
                    <Select value={selected.status} onValueChange={(v) => { updateBiz(selected.id, { status: v }); addHistory(selected.id, `Statut → ${STATUSES[v]?.label}`); }}>
                      <SelectTrigger className="h-9 text-sm bg-secondary"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-2">Valeur estimée</div>
                    <div className="text-xl font-bold text-emerald-400">{selected.estimatedValue}</div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-2">Démo</div>
                    <div className={`text-sm font-semibold ${selected.hasDemo ? "text-purple-400" : "text-zinc-600"}`}>
                      {selected.hasDemo ? "✦ Prête" : "Pas encore"}
                    </div>
                    {selected.demoNotes && <div className="text-[11px] text-zinc-500 mt-1">{selected.demoNotes}</div>}
                  </div>
                </div>

                {/* Contacts */}
                <div className="bg-card border border-border rounded-lg p-4 mb-3">
                  <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-3">Contacts</div>
                  <div className="flex gap-4 items-center text-sm mb-2 flex-wrap">
                    <span>📧 {selected.email}</span>
                    <span className="text-zinc-700">·</span>
                    <span>📞 {selected.phone}</span>
                  </div>
                  {selected.contacts.map((c, i) => (
                    <div key={i} className="text-xs text-zinc-400 mb-1">{c.name} ({c.role}) — {c.phone}</div>
                  ))}
                </div>

                {/* Issues + Improvements */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-[10px] text-red-400 tracking-widest uppercase font-bold mb-3">Problèmes ({selected.issues.length})</div>
                    {selected.issues.map((issue, i) => (
                      <div key={i} className="text-xs text-zinc-400 mb-2 flex gap-2 leading-relaxed">
                        <span className="text-red-400 shrink-0">✗</span>{issue}
                      </div>
                    ))}
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-[10px] text-emerald-400 tracking-widest uppercase font-bold mb-3">Améliorations ({selected.improvements.length})</div>
                    {selected.improvements.map((imp, i) => (
                      <div key={i} className="text-xs text-zinc-400 mb-2 flex gap-2 leading-relaxed">
                        <span className="text-emerald-400 shrink-0">✓</span>{imp}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-card border border-border rounded-lg p-4 mb-3">
                  <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-2">Notes personnelles</div>
                  <Textarea
                    value={selected.notes || ""}
                    onChange={(e) => updateBiz(selected.id, { notes: e.target.value })}
                    placeholder="Ajouter des notes sur cette entreprise..."
                    className="bg-secondary border-border text-sm min-h-[80px] resize-y"
                  />
                </div>

                {/* History */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-3">Historique</div>
                  {(selected.history || []).length === 0 && <div className="text-xs text-zinc-700">Aucune activité</div>}
                  {(selected.history || []).map((h, i) => (
                    <div key={i} className="flex gap-3 mb-2 text-xs">
                      <span className="text-zinc-600 shrink-0 whitespace-nowrap">{h.ts}</span>
                      <span className="text-zinc-400">{h.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── COMPOSE ─── */}
            {activeTab === "compose" && selected && (
              <div className="max-w-[700px]">
                <h2 className="text-lg font-bold text-white mb-1">Composer un message</h2>
                <p className="text-xs text-zinc-500 mb-5">Pour : {selected.name}</p>

                <div className="flex gap-1.5 mb-5">
                  {([["email", "📧 Email initial"], ["sms", "💬 SMS"], ["followup", "🔄 Relance"]] as const).map(([k, l]) => (
                    <Button key={k} variant={composeType === k ? "default" : "secondary"} size="sm"
                      className={`text-xs h-8 ${composeType === k ? "bg-indigo-600" : ""}`}
                      onClick={() => setComposeType(k)}>{l}</Button>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-lg p-5 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-zinc-500">
                      À : <span className="text-zinc-300">{composeType === "sms" ? selected.phone : selected.email}</span>
                    </div>
                    <Button size="sm" className={`text-xs h-8 ${copied ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"}`} onClick={copyMsg}>
                      {copied ? "✓ Copié!" : "📋 Copier"}
                    </Button>
                  </div>
                  <pre className="bg-black/30 p-4 rounded-lg text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words max-h-[400px] overflow-auto border border-zinc-800/50">
                    {composeType === "email" ? generateEmail(selected) : composeType === "sms" ? generateSMS(selected) : generateFollowUp(selected)}
                  </pre>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="text-xs h-9" onClick={() => {
                    updateBiz(selected.id, { status: "contacted" });
                    addHistory(selected.id, `Email envoyé à ${selected.email}`);
                  }}>✓ Marquer comme contacté</Button>
                  {selected.hasDemo && (
                    <Button variant="secondary" size="sm" className="text-xs h-9 text-purple-400 hover:text-purple-300" onClick={() => {
                      updateBiz(selected.id, { status: "demo_sent" });
                      addHistory(selected.id, "Démo envoyée");
                    }}>✦ Démo envoyée</Button>
                  )}
                </div>
              </div>
            )}

            {/* ─── ADD NEW ─── */}
            {activeTab === "addNew" && (
              <div className="max-w-[500px]">
                <h2 className="text-lg font-bold text-white mb-1">Ajouter une entreprise</h2>
                <p className="text-xs text-zinc-500 mb-6">Après analyse d'un nouveau site web</p>

                <div className="space-y-4">
                  {[
                    { key: "name" as const, label: "Nom de l'entreprise", ph: "Ex: Toiture ABC" },
                    { key: "url" as const, label: "URL du site", ph: "https://..." },
                    { key: "sector" as const, label: "Secteur", ph: "Ex: Toiture, Plomberie..." },
                    { key: "phone" as const, label: "Téléphone", ph: "(418) 000-0000" },
                    { key: "email" as const, label: "Email", ph: "info@..." },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-[11px] text-zinc-500 tracking-wider uppercase font-semibold mb-1.5 block">{f.label}</label>
                      <Input value={newBiz[f.key]} onChange={(e) => setNewBiz({ ...newBiz, [f.key]: e.target.value })}
                        placeholder={f.ph} className="bg-secondary border-border" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[11px] text-zinc-500 tracking-wider uppercase font-semibold mb-1.5 block">Note</label>
                    <Select value={newBiz.grade} onValueChange={(v) => setNewBiz({ ...newBiz, grade: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(GRADES).map(([k, v]) => <SelectItem key={k} value={k}>{k} — {v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 tracking-wider uppercase font-semibold mb-1.5 block">Notes</label>
                    <Textarea value={newBiz.notes} onChange={(e) => setNewBiz({ ...newBiz, notes: e.target.value })}
                      placeholder="Notes sur le site, problèmes observés..." rows={4} className="bg-secondary border-border resize-y" />
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-sm" onClick={addNewBusiness}>
                    + Ajouter au pipeline
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
