import { useState, useEffect, useCallback, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Sun, Moon } from "lucide-react";
import type { Business, Reminder } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Pipeline } from "@/components/pipeline";
import { BusinessDetail } from "@/components/business-detail";
import { ComposeMessage } from "@/components/compose-message";
import { AddBusiness } from "@/components/add-business";
import { Scanner } from "@/components/scanner";
import { Email } from "@/components/email";
import { Monitor } from "@/components/monitor";
import { Analytics } from "@/components/analytics";
import { Logs } from "@/components/logs";

type Tab = "pipeline" | "detail" | "compose" | "addNew" | "scanner" | "email" | "analytics" | "monitor" | "logs";

function BusinessPicker({ businesses, selectedId, onSelect }: {
  businesses: Business[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = businesses.find((b) => b.id === selectedId);
  const filtered = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative mb-4 max-w-xs">
      <button
        onClick={() => { setOpen(!open); setSearch(""); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="truncate">{selected?.name || "Sélectionner..."}</span>
        <svg className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <div className="p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</div>
            ) : filtered.map((b) => (
              <button
                key={b.id}
                onClick={() => { onSelect(b.id); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  b.id === selectedId
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <span className="truncate">{b.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{b.grade}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [filterStatus, setFilterStatus] = useState("all");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reminders for sidebar badges
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Email notification badge
  const [unreadEmails, setUnreadEmails] = useState(0);
  const lastEmailCountRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    api
      .getBusinesses()
      .then((data) => {
        setBusinesses(data);
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      })
      .finally(() => setLoading(false));

    api.getReminders().then(setReminders).catch(() => {});
  }, []);

  // Email notification polling
  useEffect(() => {
    const poll = () => {
      api.getEmails({ direction: "received" }).then((emails) => {
        if (lastEmailCountRef.current > 0 && emails.length > lastEmailCountRef.current) {
          setUnreadEmails((prev) => prev + (emails.length - lastEmailCountRef.current));
        }
        lastEmailCountRef.current = emails.length;
      }).catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  const selected =
    businesses.find((b) => b.id === selectedId) || businesses[0];

  const updateBiz = useCallback(
    async (id: string, updates: Partial<Business>) => {
      setSaving(true);
      try {
        const updated = await api.updateBusiness(id, updates);
        setBusinesses((prev) =>
          prev.map((b) => (b.id === id ? updated : b)),
        );
      } finally {
        setTimeout(() => setSaving(false), 400);
      }
    },
    [],
  );

  const addHistory = useCallback(async (id: string, action: string) => {
    const entry = await api.addHistory(id, action);
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, history: [entry, ...b.history] } : b,
      ),
    );
  }, []);

  const addNewBusiness = async (entry: Omit<Business, "history">) => {
    setSaving(true);
    try {
      const created = await api.createBusiness(entry);
      setBusinesses((prev) => [...prev, created]);
      setSelectedId(entry.id);
      setActiveTab("detail");
    } finally {
      setSaving(false);
    }
  };

  // Drag & drop status change
  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    const label = STATUSES[newStatus as keyof typeof STATUSES]?.label || newStatus;
    await updateBiz(id, { status: newStatus as Business["status"] });
    await addHistory(id, `Statut changé → ${label}`);
  }, [updateBiz, addHistory]);

  // Bulk operations
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkStatusChange = useCallback(async (status: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await api.bulkUpdateBusinesses(ids, { status: status as Business["status"] });
    const data = await api.getBusinesses();
    setBusinesses(data);
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} entreprise(s) ?`)) return;
    const ids = Array.from(selectedIds);
    await api.bulkDeleteBusinesses(ids);
    const data = await api.getBusinesses();
    setBusinesses(data);
    setSelectedIds(new Set());
    setBulkMode(false);
    if (ids.includes(selectedId) && data.length > 0) setSelectedId(data[0].id);
  }, [selectedIds, selectedId]);

  const handleBulkExportCSV = useCallback(() => {
    const sel = businesses.filter((b) => selectedIds.has(b.id));
    const headers = ["Nom", "URL", "Secteur", "Grade", "Score", "Tel", "Email", "Statut", "Valeur"];
    const rows = sel.map((b) => [
      b.name, b.url, b.sector, b.grade, b.score ?? "", b.phone, b.email,
      STATUSES[b.status as keyof typeof STATUSES]?.label || b.status, b.estimatedValue,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selection-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [businesses, selectedIds]);

  const totalValue = businesses.filter((b) => b.status !== "archived").reduce((a, b) => {
    const match = (b.estimatedValue || "").match(/[\d\s]+/);
    const val = match ? parseInt(match[0].replace(/\s/g, "")) : 0;
    return a + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSelectBusiness = (id: string) => {
    setSelectedId(id);
    if (activeTab === "addNew") setActiveTab("detail");
    setSidebarOpen(false);
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "pipeline", label: "Pipeline" },
    { key: "detail", label: "Fiche" },
    { key: "compose", label: "Message" },
    { key: "addNew", label: "Nouveau" },
    { key: "scanner", label: "Scanner" },
    { key: "email", label: "Email", badge: unreadEmails },
    { key: "analytics", label: "Analytics" },
    { key: "monitor", label: "Moniteur" },
    { key: "logs", label: "Logs" },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 animate-pulse">
            BA
          </div>
          <div className="text-sm text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <Sidebar
      businesses={businesses}
      selectedId={selectedId}
      filterStatus={filterStatus}
      onSelectBusiness={handleSelectBusiness}
      onFilterChange={setFilterStatus}
      onAddNew={() => {
        setActiveTab("addNew");
        setSidebarOpen(false);
      }}
      reminders={reminders}
      selectedIds={selectedIds}
      onToggleSelect={handleToggleSelect}
      bulkMode={bulkMode}
      onToggleBulkMode={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[280px] bg-card border-r border-border flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Liste des entreprises
          </SheetDescription>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 px-3 md:px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-1.5 h-full">
            <button
              className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <nav className="flex h-full">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`relative text-sm px-3 sm:px-4 flex items-center transition-colors ${
                    activeTab === t.key
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setActiveTab(t.key);
                    if (t.key === "email") setUnreadEmails(0);
                  }}
                >
                  <span className="relative z-10">
                    {t.label}
                    {t.badge != null && t.badge > 0 && (
                      <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                        {t.badge}
                      </span>
                    )}
                  </span>
                  {activeTab === t.key && (
                    <span className="gold-ring-indicator">
                      <span className="gold-ring-glow" />
                      <span className="gold-ring-border">
                        <span className="gold-ring-gradient" />
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Sauvegarde...
              </span>
            )}
            <button
              onClick={() => setDark(!dark)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title={dark ? "Mode clair" : "Mode sombre"}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {bulkMode && selectedIds.size > 0 && (
          <div className="h-10 px-4 border-b border-border flex items-center gap-2 bg-muted/50 shrink-0">
            <span className="text-xs text-muted-foreground mr-2">
              {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
            </span>
            <select
              className="h-7 text-xs rounded border border-border bg-card px-2"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleBulkStatusChange(e.target.value); e.target.value = ""; }}
            >
              <option value="" disabled>Changer statut...</option>
              {Object.entries(STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkExportCSV}>
              CSV
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>
              Supprimer
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
              onClick={() => {
                const all = businesses.map((b) => b.id);
                setSelectedIds((prev) => prev.size === all.length ? new Set() : new Set(all));
              }}
            >
              {selectedIds.size === businesses.length ? "Désélect. tout" : "Tout sélect."}
            </button>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-5 md:p-8">
            {activeTab === "pipeline" && (
              <Pipeline
                businesses={businesses}
                totalValue={totalValue}
                onSelectBusiness={(id) => {
                  setSelectedId(id);
                  setActiveTab("detail");
                }}
                onStatusChange={handleStatusChange}
              />
            )}
            {(activeTab === "detail" || activeTab === "compose") && selected && (
              <>
                <BusinessPicker
                  businesses={businesses}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                {activeTab === "detail" ? (
                  <BusinessDetail
                    business={selected}
                    onUpdate={updateBiz}
                    onAddHistory={addHistory}
                    onCompose={() => setActiveTab("compose")}
                  />
                ) : (
                  <ComposeMessage
                    business={selected}
                    onUpdate={updateBiz}
                    onAddHistory={addHistory}
                  />
                )}
              </>
            )}
            {activeTab === "addNew" && (
              <AddBusiness onAdd={addNewBusiness} saving={saving} />
            )}
            {activeTab === "scanner" && (
              <Scanner
                onBusinessAdded={() => {
                  api.getBusinesses().then(setBusinesses);
                }}
              />
            )}
            {activeTab === "email" && (
              <Email
                businesses={businesses}
                selectedBusiness={selected}
              />
            )}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "monitor" && <Monitor />}
            {activeTab === "logs" && <Logs />}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
