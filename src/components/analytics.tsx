import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, DollarSign, Users, TrendingUp, Mail, Search, BarChart3, Clock, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { STATUSES, GRADES } from "@/lib/types";
import type { Status } from "@/lib/types";

interface AnalyticsData {
  pipeline: Record<string, { count: number; value: number }>;
  totalBusinesses: number;
  totalValue: number;
  mrr: number;
  grades: Record<string, number>;
  emails: { total: number; sent: number; received: number; linkedBusinesses: number };
  scans: { totalScans: number; totalUrls: number; totalSuccess: number; totalDurationMs: number };
  conversion: { contacted: number; won: number; lost: number; conversionRate: number; closeRate: number };
  recentActivity: { ts: string; action: string; business_name: string }[];
  timeline: { month: string; count: number }[];
  topSectors: { sector: string; count: number }[];
}

type PeriodKey = "7d" | "30d" | "90d" | "all";

function formatMoney(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M$`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k$`;
  return `${n}$`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function getPeriodDates(period: PeriodKey): { from?: string; to?: string } {
  if (period === "all") return {};
  const now = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const from = new Date(now.getTime() - days * 86400000);
  return { from: from.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("all");

  const load = (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");
    const { from, to } = getPeriodDates(period);
    api.getAnalytics(from, to)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [period]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return <div className="text-sm text-destructive py-10 text-center">{error}</div>;
  }

  if (!data) return null;

  const pipelineOrder: Status[] = ["prospect", "contacted", "demo_sent", "negotiating", "closed_won", "closed_lost"];

  const periods: { key: PeriodKey; label: string }[] = [
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "90d", label: "90j" },
    { key: "all", label: "Tout" },
  ];

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-0.5 p-0.5 bg-muted/60 rounded-lg">
            {periods.map((p) => (
              <button
                key={p.key}
                className={`text-xs px-3 py-1 rounded-md transition-all ${
                  period === p.key
                    ? "bg-card text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => load(false)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Rafraichir
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={DollarSign}
          label="MRR estimé"
          value={formatMoney(data.mrr)}
          sub={`Valeur totale: ${formatMoney(data.totalValue)}`}
          color="text-emerald-500"
        />
        <KpiCard
          icon={Users}
          label="Entreprises"
          value={String(data.totalBusinesses)}
          sub={`${data.conversion.won} gagnés, ${data.conversion.lost} perdus`}
          color="text-blue-500"
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux conversion"
          value={`${data.conversion.conversionRate}%`}
          sub={`Close rate: ${data.conversion.closeRate}%`}
          color="text-amber-500"
        />
        <KpiCard
          icon={Mail}
          label="Emails"
          value={String(data.emails.total)}
          sub={`${data.emails.sent} envoyés, ${data.emails.received} reçus`}
          color="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline Funnel */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Pipeline
            </div>
            <div className="space-y-3">
              {pipelineOrder.map((status) => {
                const info = STATUSES[status];
                const entry = data.pipeline[status] || { count: 0, value: 0 };
                const pct = data.totalBusinesses > 0 ? (entry.count / data.totalBusinesses) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                        <span className="text-sm text-foreground">{info.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{entry.value > 0 ? formatMoney(entry.value) : ""}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums w-6 text-right">{entry.count}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, entry.count > 0 ? 3 : 0)}%`, backgroundColor: info.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Distribution des grades
            </div>
            <div className="space-y-3">
              {(["A", "B", "C", "D", "E", "F"] as const).map((grade) => {
                const info = GRADES[grade];
                const count = data.grades[grade] || 0;
                const pct = data.totalBusinesses > 0 ? (count / data.totalBusinesses) * 100 : 0;
                return (
                  <div key={grade}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold w-5" style={{ color: info.color }}>{grade}</span>
                        <span className="text-xs text-muted-foreground">{info.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%`, backgroundColor: info.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Scan Stats */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              Scans
            </div>
            <div className="space-y-3">
              <StatLine label="Scans effectués" value={String(data.scans.totalScans)} />
              <StatLine label="URLs trouvées" value={String(data.scans.totalUrls)} />
              <StatLine label="Sites analysés" value={String(data.scans.totalSuccess)} />
              <StatLine label="Temps total" value={formatDuration(data.scans.totalDurationMs)} />
            </div>
          </CardContent>
        </Card>

        {/* Email Stats */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              Emails
            </div>
            <div className="space-y-3">
              <StatLine label="Total" value={String(data.emails.total)} />
              <StatLine label="Envoyés" value={String(data.emails.sent)} />
              <StatLine label="Reçus" value={String(data.emails.received)} />
              <StatLine label="Entreprises liées" value={String(data.emails.linkedBusinesses)} />
            </div>
          </CardContent>
        </Card>

        {/* Top Sectors */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Secteurs
            </div>
            {data.topSectors.length === 0 ? (
              <div className="text-sm text-muted-foreground/50">Aucun secteur</div>
            ) : (
              <div className="space-y-2">
                {data.topSectors.map((s) => (
                  <div key={s.sector} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate">{s.sector}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border-0 bg-primary/10 text-primary">
                      {s.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Activité récente
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="text-sm text-muted-foreground/50">Aucune activité</div>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 tabular-nums">{a.ts}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground font-medium">{a.business_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{a.action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="shadow-sm border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
