import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Business, Reminder } from "@/lib/types";
import { STATUSES, GRADES } from "@/lib/types";

type SortOption = "name-asc" | "name-desc" | "grade-asc" | "grade-desc" | "date-desc" | "value-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Nom A-Z" },
  { value: "name-desc", label: "Nom Z-A" },
  { value: "grade-asc", label: "Grade ↑" },
  { value: "grade-desc", label: "Grade ↓" },
  { value: "date-desc", label: "Date récent" },
  { value: "value-desc", label: "Valeur ↓" },
];

const GRADE_ORDER = "ABCDEF";

function extractValue(s: string): number {
  const match = (s || "").match(/[\d\s]+/);
  return match ? parseInt(match[0].replace(/\s/g, "")) || 0 : 0;
}

interface SidebarProps {
  businesses: Business[];
  selectedId: string;
  filterStatus: string;
  onSelectBusiness: (id: string) => void;
  onFilterChange: (status: string) => void;
  onAddNew: () => void;
  reminders?: Reminder[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  bulkMode?: boolean;
  onToggleBulkMode?: () => void;
}

export function Sidebar({
  businesses,
  selectedId,
  filterStatus,
  onSelectBusiness,
  onFilterChange,
  onAddNew,
  reminders = [],
  selectedIds,
  onToggleSelect,
  bulkMode = false,
  onToggleBulkMode,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");

  const today = new Date().toISOString().split("T")[0];

  const overdueByBiz = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reminders) {
      if (!r.done && r.dueDate <= today) {
        map.set(r.businessId, (map.get(r.businessId) || 0) + 1);
      }
    }
    return map;
  }, [reminders, today]);

  const totalOverdue = useMemo(() => {
    let count = 0;
    for (const v of overdueByBiz.values()) count += v;
    return count;
  }, [overdueByBiz]);

  const filtered = useMemo(() => {
    let list = businesses;

    // Filter by status — "all" excludes archived
    if (filterStatus === "all") {
      list = list.filter((b) => b.status !== "archived");
    } else {
      list = list.filter((b) => b.status === filterStatus);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.sector.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.includes(q)
      );
    }

    // Sort
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name-asc": return a.name.localeCompare(b.name, "fr");
        case "name-desc": return b.name.localeCompare(a.name, "fr");
        case "grade-asc": return GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
        case "grade-desc": return GRADE_ORDER.indexOf(b.grade) - GRADE_ORDER.indexOf(a.grade);
        case "date-desc": return 0; // already sorted by created_at from DB
        case "value-desc": return extractValue(b.estimatedValue) - extractValue(a.estimatedValue);
        default: return 0;
      }
    });

    return sorted;
  }, [businesses, filterStatus, search, sort]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold tracking-tight shadow-md shadow-primary/20">
            BA
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground leading-tight">
              Beauce Web Audit
            </div>
            <div className="text-[11px] text-muted-foreground">
              Hub de prospection
              {totalOverdue > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white">
                  {totalOverdue}
                </span>
              )}
            </div>
          </div>
        </div>

        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm mb-2.5 bg-muted/50 border-transparent"
        />

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={onFilterChange}>
            <SelectTrigger className="h-8 text-xs flex-1 bg-muted/50 border-transparent hover:border-border transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous ({businesses.filter((b) => b.status !== "archived").length})</SelectItem>
              {Object.entries(STATUSES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label} ({businesses.filter((b) => b.status === k).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs w-[110px] bg-muted/50 border-transparent hover:border-border transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.map((b) => {
            const gr = GRADES[b.grade as keyof typeof GRADES] || GRADES.C;
            const st = STATUSES[b.status as keyof typeof STATUSES] || STATUSES.prospect;
            const isActive = b.id === selectedId;
            const hasOverdue = overdueByBiz.has(b.id);
            const isSelected = selectedIds?.has(b.id) ?? false;

            return (
              <div key={b.id} className="flex items-center gap-1">
                {bulkMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect?.(b.id)}
                    className="ml-1 shrink-0"
                  />
                )}
                <button
                  onClick={() => bulkMode ? onToggleSelect?.(b.id) : onSelectBusiness(b.id)}
                  className={`relative w-full text-left pl-4 pr-3 py-3 rounded-lg transition-all duration-150 ${
                    isActive && !bulkMode
                      ? "bg-primary/[0.05]"
                      : "hover:bg-muted/70"
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="flex items-center gap-1.5">
                      {hasOverdue && (
                        <span className="w-2 h-2 rounded-full bg-destructive shrink-0 animate-pulse" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-foreground" : "text-foreground/75"
                        }`}
                      >
                        {b.name}
                      </span>
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: gr.color }}
                    >
                      {b.grade}
                    </span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Badge
                      variant="outline"
                      className="text-[11px] px-2 py-0 h-5 font-medium border-0 rounded-full"
                      style={{
                        color: st.color,
                        backgroundColor: st.color + "10",
                      }}
                    >
                      {st.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {b.sector}
                    </span>
                  </div>
                  {b.hasDemo && (
                    <span className="text-[11px] text-amber-600 mt-1 block font-medium">
                      Démo prête
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-2">
        {bulkMode && selectedIds && selectedIds.size > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-sm h-9 font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            onClick={onAddNew}
          >
            + Ajouter
          </Button>
          <Button
            variant={bulkMode ? "default" : "outline"}
            className="text-sm h-9 font-medium"
            onClick={onToggleBulkMode}
          >
            {bulkMode ? "Annuler" : "Sélect."}
          </Button>
        </div>
      </div>
    </div>
  );
}
