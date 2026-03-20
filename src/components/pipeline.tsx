import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import type { Business } from "@/lib/types";
import { STATUSES, GRADES } from "@/lib/types";

interface PipelineProps {
  businesses: Business[];
  totalValue: number;
  onSelectBusiness: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

function extractValue(s: string): number {
  const match = (s || "").match(/[\d\s]+/);
  return match ? parseInt(match[0].replace(/\s/g, "")) || 0 : 0;
}

export function Pipeline({
  businesses,
  totalValue,
  onSelectBusiness,
  onStatusChange,
}: PipelineProps) {
  // Filters
  const [gradeFilter, setGradeFilter] = useState<Set<string>>(new Set());
  const [sectorFilter, setSectorFilter] = useState("");
  const [valueMin, setValueMin] = useState("");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      if (b.status === "archived") return false;
      if (gradeFilter.size > 0 && !gradeFilter.has(b.grade)) return false;
      if (sectorFilter && !b.sector.toLowerCase().includes(sectorFilter.toLowerCase())) return false;
      if (valueMin && extractValue(b.estimatedValue) < parseInt(valueMin)) return false;
      return true;
    });
  }, [businesses, gradeFilter, sectorFilter, valueMin]);

  const toggleGrade = (grade: string) => {
    setGradeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const handleDragStart = useCallback((e: React.DragEvent, businessId: string) => {
    e.dataTransfer.setData("text/plain", businessId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, statusKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(statusKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, statusKey: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const businessId = e.dataTransfer.getData("text/plain");
    if (businessId && onStatusChange) {
      onStatusChange(businessId, statusKey);
    }
  }, [onStatusChange]);

  const handleExportCSV = () => {
    const headers = ["Nom", "URL", "Secteur", "Grade", "Score", "Tel", "Email", "Statut", "Valeur", "Démo", "Notes", "Date ajout"];
    const rows = filtered.map((b) => [
      b.name, b.url, b.sector, b.grade, b.score ?? "", b.phone, b.email,
      STATUSES[b.status as keyof typeof STATUSES]?.label || b.status,
      b.estimatedValue, b.hasDemo ? "Oui" : "Non", b.notes, "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = gradeFilter.size > 0 || sectorFilter || valueMin;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-start mb-1">
        <h2 className="text-lg font-semibold text-foreground">Pipeline</h2>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          CSV
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length}/{businesses.length} entreprises — Valeur : {totalValue.toLocaleString()}$+
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        <div className="flex gap-1">
          {(["A", "B", "C", "D", "E", "F"] as const).map((g) => {
            const info = GRADES[g];
            const active = gradeFilter.has(g);
            return (
              <button
                key={g}
                onClick={() => toggleGrade(g)}
                className={`text-xs font-bold w-7 h-7 rounded-md transition-all ${
                  active
                    ? "text-white shadow-sm"
                    : "text-muted-foreground bg-muted/50 hover:bg-muted"
                }`}
                style={active ? { backgroundColor: info.color } : undefined}
              >
                {g}
              </button>
            );
          })}
        </div>
        <Input
          placeholder="Secteur..."
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="h-7 text-xs w-32 bg-muted/50 border-transparent"
        />
        <Input
          type="number"
          placeholder="Valeur min"
          value={valueMin}
          onChange={(e) => setValueMin(e.target.value)}
          className="h-7 text-xs w-24 bg-muted/50 border-transparent"
        />
        {hasFilters && (
          <button
            onClick={() => { setGradeFilter(new Set()); setSectorFilter(""); setValueMin(""); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Effacer filtres
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-5 md:overflow-x-auto pb-4">
        {Object.entries(STATUSES).filter(([sk]) => sk !== "archived").map(([sk, si]) => {
          const items = filtered.filter((b) => b.status === sk);
          const isDragOver = dragOverCol === sk;
          return (
            <div
              key={sk}
              className={`md:min-w-[210px] md:flex-1 rounded-xl transition-all duration-200 ${
                isDragOver ? "ring-2 ring-primary/50 bg-primary/[0.02]" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, sk)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, sk)}
            >
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div
                  className="w-2 h-2 rounded-full ring-2 ring-offset-1 ring-offset-background"
                  style={{ background: si.color, boxShadow: `0 0 6px ${si.color}40`, borderColor: si.color }}
                />
                <span className="text-sm font-semibold text-foreground/80">
                  {si.label}
                </span>
                <span className="text-xs text-muted-foreground/50 ml-auto tabular-nums">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((b) => (
                  <Card
                    key={b.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b.id)}
                    className="cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-[3px]"
                    style={{ borderLeftColor: si.color }}
                    onClick={() => onSelectBusiness(b.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {b.name}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: (GRADES[b.grade as keyof typeof GRADES] || {}).color,
                          }}
                        >
                          {b.grade}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.estimatedValue}
                      </div>
                      {b.hasDemo && (
                        <div className="text-[11px] text-amber-600 mt-1.5 font-medium">
                          Démo prête
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground/30 border border-dashed border-border rounded-xl">
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
