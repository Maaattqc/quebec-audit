import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Loader2, Server, Globe, Database, Mail, Webhook, Clock, MonitorOff } from "lucide-react";

type CheckResult = { ok: boolean; detail?: string };
type HealthData = Record<string, CheckResult>;

const CHECK_LABELS: Record<string, { label: string; icon: typeof Database }> = {
  frontend: { label: "Frontend", icon: Globe },
  backend: { label: "Backend (serveur)", icon: Server },
  database: { label: "Base de données", icon: Database },
  resendKey: { label: "Clé Resend", icon: Mail },
  resendApi: { label: "API Resend", icon: Mail },
  webhookEndpoint: { label: "Webhook Email", icon: Webhook },
  emailFlow: { label: "Flux Emails", icon: Mail },
  uptime: { label: "Uptime serveur", icon: Clock },
};

const DISPLAY_ORDER = ["frontend", "backend", "database", "resendKey", "resendApi", "webhookEndpoint", "emailFlow", "uptime"];

const PROD_URL = "https://audit.mathieu-fournier.net";
const LOCAL_BACKEND = "http://127.0.0.1:3849";

interface EnvCard {
  name: string;
  frontendUrl: string;
  backendUrl: string;
  checks: HealthData | null;
  loading: boolean;
  lastCheck: Date | null;
  unreachable: boolean;
}

// Direct fetch to a health endpoint (bypasses Vite proxy)
async function fetchHealth(baseUrl: string): Promise<HealthData> {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 8000);
  const res = await fetch(`${baseUrl}/api/health`, { signal: ctrl.signal });
  clearTimeout(tm);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function Monitor() {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  const [envs, setEnvs] = useState<EnvCard[]>([
    { name: "Localhost (dev)", frontendUrl: "http://localhost:5173", backendUrl: LOCAL_BACKEND, checks: null, loading: false, lastCheck: null, unreachable: false },
    { name: "audit.mathieu-fournier.net", frontendUrl: PROD_URL, backendUrl: PROD_URL, checks: null, loading: false, lastCheck: null, unreachable: false },
  ]);

  const updateEnv = (idx: number, updates: Partial<EnvCard>) => {
    setEnvs((prev) => prev.map((e, i) => (i === idx ? { ...e, ...updates } : e)));
  };

  // Check localhost env — direct fetch to 127.0.0.1:3849 (no proxy)
  const checkLocal = useCallback(async () => {
    updateEnv(0, { loading: true, unreachable: false });
    const checks: HealthData = {};

    // Frontend (Vite dev server)
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 5000);
      await fetch("http://localhost:5173", { signal: ctrl.signal, mode: "no-cors" });
      clearTimeout(tm);
      checks.frontend = { ok: true, detail: "localhost:5173 (Vite)" };
    } catch {
      checks.frontend = { ok: false, detail: "localhost:5173 inaccessible" };
    }

    // Backend — direct fetch to 127.0.0.1:3849 (bypasses Vite proxy)
    try {
      const health = await fetchHealth(LOCAL_BACKEND);
      Object.assign(checks, health);
    } catch (err: any) {
      checks.backend = { ok: false, detail: err.name === "AbortError" ? "Timeout" : "localhost:3849 inaccessible" };
    }

    updateEnv(0, { checks, loading: false, lastCheck: new Date() });
  }, []);

  // Check production env — direct fetch to audit.mathieu-fournier.net
  const checkProd = useCallback(async () => {
    updateEnv(1, { loading: true, unreachable: false });
    const checks: HealthData = {};

    // Frontend
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(PROD_URL, { signal: ctrl.signal, mode: "no-cors" });
      clearTimeout(tm);
      // no-cors gives opaque response — no error means reachable
      checks.frontend = { ok: true, detail: res.type === "opaque" ? "Accessible" : `HTTP ${res.status}` };
    } catch (err: any) {
      checks.frontend = { ok: false, detail: err.name === "AbortError" ? "Timeout" : "Inaccessible" };
    }

    // Backend /api/health
    try {
      const health = await fetchHealth(PROD_URL);
      Object.assign(checks, health);
    } catch (err: any) {
      // CORS will block this from localhost — try via local proxy if we're on localhost
      if (isLocal) {
        try {
          const ctrl = new AbortController();
          const tm = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch(`${LOCAL_BACKEND}/api/health/remote?url=${encodeURIComponent(PROD_URL)}`, { signal: ctrl.signal });
          clearTimeout(tm);
          if (res.ok) {
            const data = await res.json();
            Object.assign(checks, data);
          } else {
            checks.backend = { ok: false, detail: `Proxy: HTTP ${res.status}` };
          }
        } catch (proxyErr: any) {
          checks.backend = { ok: false, detail: "Backend local requis pour check prod" };
        }
      } else {
        // On production, just use same-origin
        try {
          const res = await fetch("/api/health");
          if (res.ok) {
            const data = await res.json();
            Object.assign(checks, data);
          }
        } catch {
          checks.backend = { ok: false, detail: err.message || "Inaccessible" };
        }
      }
    }

    updateEnv(1, { checks, loading: false, lastCheck: new Date() });
  }, [isLocal]);

  // On production, localhost is unreachable
  const checkLocalFromProd = useCallback(() => {
    updateEnv(0, { unreachable: true, lastCheck: new Date() });
  }, []);

  const checkAll = useCallback(() => {
    if (isLocal) {
      checkLocal();
    } else {
      checkLocalFromProd();
    }
    checkProd();
  }, [isLocal, checkLocal, checkProd, checkLocalFromProd]);

  useEffect(() => { checkAll(); }, []);

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Moniteur</h2>
        <Button variant="outline" size="sm" onClick={checkAll}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Rafraichir tout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {envs.map((env, idx) => {
          const isCurrent = (isLocal && idx === 0) || (!isLocal && idx === 1);
          const entries = env.checks ? Object.entries(env.checks) : [];
          const okCount = entries.filter(([, v]) => v.ok).length;
          const totalCount = entries.length;
          const allOk = totalCount > 0 && okCount === totalCount;

          return (
            <Card key={idx} className="shadow-sm border-0 overflow-hidden">
              <div className={`h-1.5 transition-colors ${
                env.unreachable ? "bg-muted" :
                env.loading ? "bg-amber-400 animate-pulse" :
                allOk ? "bg-emerald-500" :
                env.lastCheck ? "bg-red-500" : "bg-muted"
              }`} />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{env.name}</span>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-primary border-primary/30">
                        actif
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {env.lastCheck && !env.unreachable && (
                      <span className="text-[10px] text-muted-foreground">
                        {env.lastCheck.toLocaleTimeString("fr-CA")}
                      </span>
                    )}
                    {!env.unreachable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => (idx === 0 ? checkLocal() : checkProd())}
                        disabled={env.loading}
                      >
                        {env.loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {env.unreachable ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <MonitorOff className="w-8 h-8 text-muted-foreground/40 mb-3" />
                    <div className="text-sm text-muted-foreground font-medium mb-1">Non disponible a distance</div>
                    <div className="text-xs text-muted-foreground/70">
                      Ouvre le moniteur depuis localhost pour voir ces checks
                    </div>
                  </div>
                ) : (
                  <>
                    {env.lastCheck && (
                      <div className="mb-4">
                        {allOk ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-xs font-medium">
                            Tout fonctionne ({okCount}/{totalCount})
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/15 text-red-600 border-0 text-xs font-medium">
                            {okCount}/{totalCount} services OK
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {env.checks ? (
                        [...DISPLAY_ORDER.filter((k) => k in env.checks!), ...Object.keys(env.checks).filter((k) => !DISPLAY_ORDER.includes(k))].map((key) => {
                          const val = env.checks![key];
                          const info = CHECK_LABELS[key] || { label: key, icon: Server };
                          return <StatusRow key={key} label={info.label} icon={info.icon} result={val} loading={false} />;
                        })
                      ) : env.loading ? (
                        DISPLAY_ORDER.map((key) => {
                          const info = CHECK_LABELS[key];
                          return <StatusRow key={key} label={info.label} icon={info.icon} result={null} loading={true} />;
                        })
                      ) : null}
                    </div>
                  </>
                )}

                <div className="mt-3 pt-3 border-t border-border flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono break-all">Frontend: {env.frontendUrl}</span>
                  <span className="text-[10px] text-muted-foreground font-mono break-all">Backend: {env.backendUrl}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatusRow({ label, icon: Icon, result, loading }: {
  label: string;
  icon: typeof Database;
  result: CheckResult | null;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
        ) : result ? (
          <>
            <span className="text-[11px] text-muted-foreground max-w-[200px] truncate hidden sm:block">
              {result.detail}
            </span>
            {result.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </>
        ) : (
          <span className="w-4 h-4 rounded-full bg-muted" />
        )}
      </div>
    </div>
  );
}
