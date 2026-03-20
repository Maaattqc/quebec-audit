import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { LogEntry } from "@/lib/types";

const ACTION_COLORS: Record<string, string> = {
  "Entreprise créée": "#22c55e",
  "Entreprise modifiée": "#3b82f6",
  "Entreprise supprimée": "#ef4444",
  "Ajouté via scanner": "#a855f7",
  "Scan terminé": "#0ea5e9",
  "Scan échoué": "#ef4444",
  "Email envoyé": "#f59e0b",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    api.getLogs().then(setLogs).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || (l.businessId || "").toLowerCase().includes(q);
  });

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Logs</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      <Card className="shadow-sm border-0">
        <CardContent className="p-5">
          <div className="mb-4">
            <Input
              placeholder="Filtrer par action, détail ou entreprise..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
            {filtered.length} entrée{filtered.length > 1 ? "s" : ""}
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground/50 py-8 text-center">
              {loading ? "Chargement..." : "Aucun log"}
            </div>
          ) : (
            <div className="space-y-0">
              {filtered.map((log) => {
                const color = ACTION_COLORS[log.action] || "#64748b";
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0"
                  >
                    <div className="shrink-0 pt-0.5">
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0 h-5 font-medium border-0 rounded-full whitespace-nowrap"
                        style={{ color, backgroundColor: color + "15" }}
                      >
                        {log.action}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground">{log.detail || "—"}</span>
                      {log.businessId && (
                        <span className="ml-2 text-xs text-muted-foreground">({log.businessId})</span>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
