import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock, Globe, CheckCircle, AlertTriangle, StopCircle, XCircle, Download, ChevronDown, ChevronLeft, ChevronRight, MapPin, Star, Search, Building2, Eye, EyeOff, ExternalLink, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ScanResult, NoSiteResult, ScanStats, ScanHistoryEntry, CategoryKey, ReqResult } from "@/lib/types";
import { GRADES, CATEGORIES } from "@/lib/types";

const REGIONS = [
  "Bas-Saint-Laurent",
  "Saguenay–Lac-Saint-Jean",
  "Capitale-Nationale",
  "Mauricie",
  "Estrie",
  "Montréal",
  "Outaouais",
  "Abitibi-Témiscamingue",
  "Côte-Nord",
  "Nord-du-Québec",
  "Gaspésie–Îles-de-la-Madeleine",
  "Chaudière-Appalaches",
  "Laval",
  "Lanaudière",
  "Laurentides",
  "Montérégie",
  "Centre-du-Québec",
  "Québec",
];

type ScanMode = "with-site" | "no-site" | "maps" | "req";
type ScanTab = "scan" | "history";

interface ScannerProps {
  onBusinessAdded: () => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function Scanner({ onBusinessAdded }: ScannerProps) {
  const [sector, setSector] = useState("toiture");
  const [region, setRegion] = useState("Québec");
  const [maxResults, setMaxResults] = useState("50");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ScanMode>("with-site");
  const [tab, setTab] = useState<ScanTab>("scan");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [noSiteResults, setNoSiteResults] = useState<NoSiteResult[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [progress, setProgress] = useState<{ scanned: number; total: number; success: number } | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [error, setError] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());

  // Preview pane
  const [previewMode, setPreviewMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUseProxy, setPreviewUseProxy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const previewListRef = useRef<HTMLDivElement>(null);

  // Column filters — with-site
  const [filterName, setFilterName] = useState("");
  const [filterUrl, setFilterUrl] = useState("");
  const [gradeSortDir, setGradeSortDir] = useState<"asc" | "desc" | null>(null);
  const [filterPhone, setFilterPhone] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterIssuesMin, setFilterIssuesMin] = useState("");
  const [filterScoreMin, setFilterScoreMin] = useState("");
  const [filterScoreMax, setFilterScoreMax] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Column filters — no-site / maps
  const [filterNsName, setFilterNsName] = useState("");
  const [filterNsAddress, setFilterNsAddress] = useState("");
  const [filterNsPhone, setFilterNsPhone] = useState("");
  const [filterNsSource, setFilterNsSource] = useState("");
  const [mapsShowAll, setMapsShowAll] = useState(true);

  // REQ mode state
  const [reqResults, setReqResults] = useState<ReqResult[]>([]);
  const [filterReqName, setFilterReqName] = useState("");
  const [filterReqCity, setFilterReqCity] = useState("");
  const [filterReqActivity, setFilterReqActivity] = useState("");
  const [filterReqEmployees, setFilterReqEmployees] = useState("");
  const [reqSearching, setReqSearching] = useState<Set<string>>(new Set());
  const [expandedReqRow, setExpandedReqRow] = useState<string | null>(null);
  const [reqCities, setReqCities] = useState<{ city: string; count: number }[]>([]);
  const [reqCityInput, setReqCityInput] = useState("");
  const [reqCityOpen, setReqCityOpen] = useState(false);
  const reqCityRef = useRef<HTMLDivElement>(null);

  // Column filters & sort — history
  const [filterHSector, setFilterHSector] = useState("");
  const [filterHRegion, setFilterHRegion] = useState("");
  const [filterHEnv, setFilterHEnv] = useState("");
  const [historySortCol, setHistorySortCol] = useState<string | null>(null);
  const [historySortDir, setHistorySortDir] = useState<"asc" | "desc">("asc");

  const filteredResults = useMemo(() => {
    const filtered = results.filter((r) => {
      if (filterName && !r.name.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterUrl && !r.url.toLowerCase().includes(filterUrl.toLowerCase())) return false;
      if (filterPhone && !r.phone.includes(filterPhone)) return false;
      if (filterEmail && !r.email.toLowerCase().includes(filterEmail.toLowerCase())) return false;
      if (filterIssuesMin && r.issues.length < parseInt(filterIssuesMin)) return false;
      if (filterScoreMin && (r.score ?? 100) < parseInt(filterScoreMin)) return false;
      if (filterScoreMax && (r.score ?? 0) > parseInt(filterScoreMax)) return false;
      return true;
    });
    if (gradeSortDir) {
      filtered.sort((a, b) => {
        const diff = (a.score ?? 100) - (b.score ?? 100);
        return gradeSortDir === "asc" ? -diff : diff;
      });
    }
    return filtered;
  }, [results, filterName, filterUrl, gradeSortDir, filterPhone, filterEmail, filterIssuesMin, filterScoreMin, filterScoreMax]);

  const filteredNoSite = useMemo(() => {
    return noSiteResults.filter((r) => {
      if (!mapsShowAll && mode === "maps" && r.hasWebsite) return false;
      if (filterNsName && !r.name.toLowerCase().includes(filterNsName.toLowerCase())) return false;
      if (filterNsAddress && !r.address.toLowerCase().includes(filterNsAddress.toLowerCase())) return false;
      if (filterNsPhone && !r.phone.includes(filterNsPhone)) return false;
      if (filterNsSource && !r.source.toLowerCase().includes(filterNsSource.toLowerCase())) return false;
      return true;
    });
  }, [noSiteResults, filterNsName, filterNsAddress, filterNsPhone, filterNsSource, mapsShowAll, mode]);

  const filteredReq = useMemo(() => {
    return reqResults.filter((r) => {
      if (filterReqName && !r.name.toLowerCase().includes(filterReqName.toLowerCase())) return false;
      if (filterReqCity && !r.city.toLowerCase().includes(filterReqCity.toLowerCase())) return false;
      if (filterReqActivity && !r.activityDesc.toLowerCase().includes(filterReqActivity.toLowerCase())) return false;
      if (filterReqEmployees && !r.employeeLabel.toLowerCase().includes(filterReqEmployees.toLowerCase())) return false;
      return true;
    });
  }, [reqResults, filterReqName, filterReqCity, filterReqActivity, filterReqEmployees]);

  const filteredHistory = useMemo(() => {
    const filtered = history.filter((h) => {
      if (filterHSector && !h.sector.toLowerCase().includes(filterHSector.toLowerCase())) return false;
      if (filterHRegion && !h.region.toLowerCase().includes(filterHRegion.toLowerCase())) return false;
      if (filterHEnv) {
        const envLabel = h.env === "local" ? "québec" : h.env === "prod" ? "france" : "";
        if (!envLabel.includes(filterHEnv.toLowerCase())) return false;
      }
      return true;
    });
    if (historySortCol) {
      const m = historySortDir === "asc" ? 1 : -1;
      filtered.sort((a, b) => {
        let va: number | string, vb: number | string;
        switch (historySortCol) {
          case "date": va = a.createdAt; vb = b.createdAt; break;
          case "env": va = a.env || ""; vb = b.env || ""; break;
          case "sector": va = a.sector.toLowerCase(); vb = b.sector.toLowerCase(); break;
          case "region": va = a.region.toLowerCase(); vb = b.region.toLowerCase(); break;
          case "urls": va = a.urlsFound; vb = b.urlsFound; break;
          case "success": va = a.sitesSuccess; vb = b.sitesSuccess; break;
          case "fails": va = a.sitesScanned - a.sitesSuccess; vb = b.sitesScanned - b.sitesSuccess; break;
          case "duration": va = a.durationMs; vb = b.durationMs; break;
          default: return 0;
        }
        return va < vb ? -m : va > vb ? m : 0;
      });
    }
    return filtered;
  }, [history, filterHSector, filterHRegion, filterHEnv, historySortCol, historySortDir]);

  useEffect(() => {
    if (tab === "history") {
      api.getScanHistory().then(setHistory).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (mode === "req" && reqCities.length === 0) {
      api.getReqCities().then(setReqCities).catch(() => {});
    }
  }, [mode]);

  const filteredCities = useMemo(() => {
    if (!reqCityInput || reqCityInput.length < 1) return reqCities.slice(0, 20);
    const q = reqCityInput.toLowerCase();
    return reqCities.filter(c => c.city.toLowerCase().includes(q)).slice(0, 20);
  }, [reqCities, reqCityInput]);

  // Preview keyboard navigation
  useEffect(() => {
    if (!previewMode || mode !== "with-site") return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPreviewIndex((prev) => {
          const next = findValidIndex(prev + 1, 1);
          if (next === -1) return prev;
          selectPreviewResult(next);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPreviewIndex((prev) => {
          const next = findValidIndex(prev - 1, -1);
          if (next === -1) return prev;
          selectPreviewResult(next);
          return next;
        });
      } else if (e.key === "Enter" || e.key === "a") {
        e.preventDefault();
        const r = filteredResults[previewIndex];
        if (r && !r.failed && !addedUrls.has(r.url)) handleAdd(r);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPreviewMode(false);
        setPreviewUrl(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewMode, mode, previewIndex, filteredResults, addedUrls]);

  const findValidIndex = (from: number, direction: 1 | -1): number => {
    let i = from;
    while (i >= 0 && i < filteredResults.length) {
      if (!filteredResults[i].failed) return i;
      i += direction;
    }
    return -1;
  };

  const selectPreviewResult = (index: number) => {
    const r = filteredResults[index];
    if (r) {
      setPreviewUrl(r.url);
      setPreviewUseProxy(false);
      setPreviewError(false);
      setPreviewLoading(true);
      // Scroll the row into view
      const row = previewListRef.current?.querySelector(`[data-preview-idx="${index}"]`);
      row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  const togglePreview = () => {
    if (previewMode) {
      setPreviewMode(false);
      setPreviewUrl(null);
    } else {
      setPreviewMode(true);
      const first = findValidIndex(0, 1);
      setPreviewIndex(first === -1 ? 0 : first);
      if (first !== -1) {
        setPreviewUrl(filteredResults[first].url);
        setPreviewUseProxy(false);
        setPreviewError(false);
        setPreviewLoading(true);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (reqCityRef.current && !reqCityRef.current.contains(e.target as Node)) {
        setReqCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stopScan = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLoading(false);
  }, []);

  const handleScan = async (forceRescan = false) => {
    if (!sector || !region) return;
    setLoading(true);
    setError("");
    setResults([]);
    setNoSiteResults([]);
    setPreviewIndex(0);
    setPreviewUrl(null);
    setReqResults([]);
    setStats(null);
    setProgress(null);

    if (mode === "req") {
      try {
        const data = await api.scanReq(sector, region);
        setReqResults(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur lors du scan REQ");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "no-site" || mode === "maps") {
      try {
        const data = await api.scanNoSite(sector, region, mode === "maps", forceRescan);
        setNoSiteResults(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur lors du scan");
      } finally {
        setLoading(false);
      }
      return;
    }

    // SSE streaming for with-site mode
    const max = parseInt(maxResults) || 50;
    const params = new URLSearchParams({ sector, region, max: String(max) });
    if (forceRescan) params.set("force", "1");
    const es = new EventSource(`/api/scan/stream?${params}`);
    eventSourceRef.current = es;

    es.addEventListener("urls", (e) => {
      const data = JSON.parse(e.data);
      setProgress((prev) => ({ scanned: prev?.scanned ?? 0, total: data.count, success: prev?.success ?? 0 }));
    });

    es.addEventListener("result", (e) => {
      const result = JSON.parse(e.data) as ScanResult;
      setResults((prev) => [...prev, result]);
    });

    es.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress({ scanned: data.scanned, total: data.total, success: data.success });
    });

    es.addEventListener("done", (e) => {
      const data = JSON.parse(e.data) as ScanStats;
      setStats(data);
      setLoading(false);
      setProgress(null);
      es.close();
      eventSourceRef.current = null;
    });

    es.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data);
        setError(data.message || "Erreur");
      }
      setLoading(false);
      es.close();
      eventSourceRef.current = null;
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      setLoading(false);
      es.close();
      eventSourceRef.current = null;
    };
  };

  const handleAdd = async (result: ScanResult) => {
    try {
      await api.addScanResult(result);
      setResults((prev) => prev.filter((r) => r.url !== result.url));
      onBusinessAdded();
    } catch (err: any) {
      if (err?.status === 409) {
        setAddedUrls((prev) => new Set(prev).add(result.url));
      }
    }
  };

  const handleAddNoSite = async (result: NoSiteResult) => {
    try {
      await api.addNoSiteResult(result);
      setNoSiteResults((prev) => prev.filter((r) => r.name !== result.name));
      onBusinessAdded();
    } catch (err: any) {
      if (err?.status === 409) {
        setAddedUrls((prev) => new Set(prev).add(result.name));
      }
    }
  };

  const handleReqSearchSite = async (neq: string, name: string, city: string) => {
    setReqSearching((prev) => new Set(prev).add(neq));
    try {
      const { url, found, phone, email } = await api.reqSearchSite(name, city, neq);
      if (found) {
        setReqResults((prev) => prev.map((r) => r.neq === neq ? { ...r, url, phone: phone || r.phone, email: email || r.email } : r));
      }
    } catch { /* ignore */ }
    setReqSearching((prev) => { const s = new Set(prev); s.delete(neq); return s; });
  };

  const handleAddReq = async (result: ReqResult) => {
    try {
      await api.addNoSiteResult({
        name: result.name,
        address: result.address,
        phone: result.phone || "",
        email: result.email || "",
        source: `Registre QC (NEQ: ${result.neq})`,
        hasWebsite: !!result.url,
        url: result.url || "",
      });
      setReqResults((prev) => prev.filter((r) => r.neq !== result.neq));
      onBusinessAdded();
    } catch (err: any) {
      if (err?.status === 409) {
        setAddedUrls((prev) => new Set(prev).add(result.neq));
      }
    }
  };

  const handleAddAll = async () => {
    if (mode === "with-site") {
      const toAdd = filteredResults.filter((r) => !r.failed);
      for (const r of toAdd) {
        try { await api.addScanResult(r); } catch { /* skip */ }
      }
      setResults((prev) => prev.filter((r) => !toAdd.includes(r)));
    } else {
      const toAdd = filteredNoSite;
      for (const r of toAdd) {
        try { await api.addNoSiteResult(r); } catch { /* skip */ }
      }
      setNoSiteResults((prev) => prev.filter((r) => !toAdd.includes(r)));
    }
    onBusinessAdded();
  };

  const handleExportCSV = () => {
    const catKeys = Object.keys(CATEGORIES) as CategoryKey[];
    const headers = ['Nom', 'URL', 'Grade', 'Score', 'Tel', 'Email', 'Issues', ...catKeys.map(k => CATEGORIES[k].label)];
    const rows = filteredResults.filter(r => !r.failed).map(r => [
      r.name, r.url, r.grade, r.score ?? '', r.phone, r.email,
      r.issues.join('; '),
      ...catKeys.map(k => r.categoryScores?.[k] ?? ''),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = csvUrl;
    a.download = `scan-${sector}-${region}.csv`;
    a.click();
    URL.revokeObjectURL(csvUrl);
  };

  const hasResults = results.length > 0 || noSiteResults.length > 0 || reqResults.length > 0;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Scanner</h2>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              tab === "scan" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setTab("scan")}
          >
            Scanner
          </button>
          <button
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              tab === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setTab("history")}
          >
            Historique
          </button>
        </div>
      </div>

      {tab === "scan" ? (
        <>
          <Card className="mb-6 shadow-sm border-0">
            <CardContent className="p-5">
              <div className="flex gap-2 mb-4 items-center">
                {([
                  ["with-site", "Audit site web"],
                  ["maps", "Google Maps"],
                  ["no-site", "Pages Jaunes"],
                  ["req", "Registre QC"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                      mode === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMode(key)}
                  >
                    {key === "maps" && <MapPin className="w-3.5 h-3.5" />}
                    {key === "req" && <Building2 className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder={mode === "req" ? "Activité (ex: construction, comptable...)" : "Secteur (ex: plomberie, toiture...)"}
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="flex-1"
                />
                {mode === "req" ? (
                  <div className="relative w-full sm:w-[220px]" ref={reqCityRef}>
                    <Input
                      placeholder="Ville (ex: Saint-Georges...)"
                      value={region}
                      onChange={(e) => { setRegion(e.target.value); setReqCityInput(e.target.value); setReqCityOpen(true); }}
                      onFocus={() => { setReqCityInput(region); setReqCityOpen(true); }}
                      className="w-full"
                    />
                    {reqCityOpen && filteredCities.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-[240px] overflow-y-auto">
                        {filteredCities.map((c) => (
                          <button
                            key={c.city}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex justify-between items-center"
                            onClick={() => { setRegion(c.city); setReqCityOpen(false); }}
                          >
                            <span className="text-foreground">{c.city}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{c.count.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Région" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {(mode === "no-site" || mode === "maps") && !loading && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Pages Jaunes + Google Maps + Google Search
                  </div>
                )}
                {mode === "req" && !loading && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Registre des entreprises du Québec
                  </div>
                )}
                {mode === "with-site" && (
                  <Select value={maxResults} onValueChange={setMaxResults}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 sites</SelectItem>
                      <SelectItem value="50">50 sites</SelectItem>
                      <SelectItem value="75">75 sites</SelectItem>
                      <SelectItem value="100">100 sites</SelectItem>
                      <SelectItem value="500">500 sites</SelectItem>
                      <SelectItem value="1000">1000 sites</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {loading ? (
                  <Button
                    onClick={stopScan}
                    variant="destructive"
                    className="shadow-sm"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Arrêter
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleScan()}
                      disabled={!sector || !region}
                      className="shadow-sm shadow-primary/20"
                    >
                      Scanner
                    </Button>
                    {hasResults && mode !== "req" && (
                      <Button
                        onClick={() => handleScan(true)}
                        disabled={!sector || !region}
                        variant="outline"
                        className="shadow-sm"
                      >
                        Rescan
                      </Button>
                    )}
                  </>
                )}
              </div>

              {loading && progress && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {progress.scanned}/{progress.total} sites analysés — {progress.success} réussis
                    </span>
                    <span>{Math.round((progress.scanned / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(progress.scanned / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {loading && !progress && mode === "with-site" && (
                <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Recherche des URLs...
                </div>
              )}

              {error && (
                <div className="mt-3 text-sm text-destructive">{error}</div>
              )}
            </CardContent>
          </Card>

          {/* Stats card */}
          {stats && (
            <Card className="mb-4 shadow-sm border-0">
              <CardContent className="p-5">
                <div className="text-xs text-muted-foreground tracking-wider uppercase mb-3 font-medium">
                  Statistiques du scan
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-lg font-semibold text-foreground">{stats.urlsFound}</div>
                      <div className="text-xs text-muted-foreground">URLs trouvées</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-lg font-semibold text-foreground">{stats.sitesSuccess}</div>
                      <div className="text-xs text-muted-foreground">Sites analysés</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {stats.sitesScanned - stats.sitesSuccess}
                      </div>
                      <div className="text-xs text-muted-foreground">Échecs</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {formatDuration(stats.durationMs)}
                      </div>
                      <div className="text-xs text-muted-foreground">Durée</div>
                    </div>
                  </div>
                </div>
                {/* Grade distribution */}
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(stats.grades)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([grade, count]) => {
                      const info = GRADES[grade as keyof typeof GRADES];
                      return (
                        <Badge
                          key={grade}
                          variant="outline"
                          className="text-xs font-bold border-0"
                          style={{ color: info?.color, backgroundColor: (info?.color || "#888") + "15" }}
                        >
                          {grade}: {count}
                        </Badge>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {hasResults && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs text-muted-foreground tracking-wider uppercase font-medium">
                    Résultats ({mode === "with-site"
                      ? `${filteredResults.length}/${results.length}`
                      : mode === "req"
                      ? `${filteredReq.length}/${reqResults.length}`
                      : `${filteredNoSite.length}/${noSiteResults.length}`})
                  </div>
                  <div className="flex gap-2">
                    {mode === "with-site" && filteredResults.length > 0 && (
                      <>
                        <Button variant={previewMode ? "default" : "outline"} size="sm" onClick={togglePreview}>
                          {previewMode ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                          Aperçu
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCSV}>
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          CSV
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleAddAll}>
                      Tout ajouter
                    </Button>
                  </div>
                </div>

                {mode === "with-site" ? (
                  previewMode && previewUrl ? (
                    <div className="flex gap-4">
                      {/* Left: compact table */}
                      <div ref={previewListRef} className="w-[40%] shrink-0 overflow-y-auto max-h-[calc(100vh-250px)] border-r border-border pr-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="pb-1 font-medium text-muted-foreground text-xs">Nom</th>
                              <th className="pb-1 font-medium text-muted-foreground text-xs text-center">Grade</th>
                              <th className="pb-1 text-right text-xs"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredResults.map((r, i) => {
                              const gradeInfo = GRADES[r.grade as keyof typeof GRADES];
                              const isFailed = r.failed;
                              const isSelected = i === previewIndex;
                              return (
                                <tr
                                  key={i}
                                  data-preview-idx={i}
                                  className={`border-b border-border/50 last:border-0 cursor-pointer transition-colors ${
                                    isFailed ? "opacity-50" : ""
                                  } ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                                  onClick={() => { setPreviewIndex(i); selectPreviewResult(i); }}
                                >
                                  <td className="py-2 pr-2 font-medium max-w-[180px] truncate text-xs">
                                    {isFailed ? (
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <XCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                                        {r.name}
                                      </span>
                                    ) : r.name}
                                  </td>
                                  <td className="py-2 pr-2 text-center">
                                    {isFailed ? (
                                      <span className="text-[10px] text-destructive">Erreur</span>
                                    ) : gradeInfo ? (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold border-0 tabular-nums"
                                        style={{ color: gradeInfo.color, backgroundColor: gradeInfo.color + "15" }}
                                      >
                                        {r.grade} {r.score != null ? r.score : ""}
                                      </Badge>
                                    ) : null}
                                  </td>
                                  <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                    {!isFailed && (
                                      addedUrls.has(r.url) ? (
                                        <span className="text-[10px] text-muted-foreground">Ajouté</span>
                                      ) : (
                                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleAdd(r)}>
                                          Ajouter
                                        </Button>
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Right: preview pane */}
                      <div className="flex-1 flex flex-col min-w-0">
                        {/* Toolbar */}
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-2 pb-2 border-b border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate flex items-center gap-1">
                              {(() => { try { return new URL(previewUrl).hostname; } catch { return previewUrl; } })()}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                            {filteredResults[previewIndex] && !filteredResults[previewIndex].failed && (() => {
                              const r = filteredResults[previewIndex];
                              const gi = GRADES[r.grade as keyof typeof GRADES];
                              return gi ? (
                                <Badge variant="outline" className="text-xs font-bold border-0 tabular-nums" style={{ color: gi.color, backgroundColor: gi.color + "15" }}>
                                  {r.grade} {r.score != null ? r.score : ""}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                              disabled={findValidIndex(previewIndex - 1, -1) === -1}
                              onClick={() => { const next = findValidIndex(previewIndex - 1, -1); if (next !== -1) { setPreviewIndex(next); selectPreviewResult(next); } }}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground tabular-nums px-1">
                              {previewIndex + 1}/{filteredResults.length}
                            </span>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                              disabled={findValidIndex(previewIndex + 1, 1) === -1}
                              onClick={() => { const next = findValidIndex(previewIndex + 1, 1); if (next !== -1) { setPreviewIndex(next); selectPreviewResult(next); } }}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            {previewError && !previewUseProxy && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setPreviewUseProxy(true); setPreviewError(false); setPreviewLoading(true); }}>
                                Essayer via proxy
                              </Button>
                            )}
                            {filteredResults[previewIndex] && !filteredResults[previewIndex].failed && !addedUrls.has(filteredResults[previewIndex].url) && (
                              <Button size="sm" onClick={() => handleAdd(filteredResults[previewIndex])}>
                                Ajouter
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setPreviewMode(false); setPreviewUrl(null); }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Iframe with preloaded adjacent */}
                        <div className="relative flex-1 overflow-hidden rounded border border-border" style={{ height: "calc(100vh - 300px)" }}>
                          {previewLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                          )}
                          {[previewIndex - 2, previewIndex - 1, previewIndex, previewIndex + 1, previewIndex + 2, previewIndex + 3].map((idx) => {
                            const r = filteredResults[idx];
                            if (!r) return null;
                            const isCurrent = idx === previewIndex;
                            const src = isCurrent && previewUseProxy ? api.siteProxyUrl(r.url) : r.url;
                            return (
                              <iframe
                                key={`preview-${idx}-${r.url}`}
                                src={src}
                                sandbox="allow-same-origin allow-scripts"
                                className="bg-white absolute top-0 left-0"
                                style={{
                                  width: "166.67%",
                                  height: "166.67%",
                                  transform: "scale(0.6)",
                                  transformOrigin: "top left",
                                  visibility: isCurrent ? "visible" : "hidden",
                                  pointerEvents: isCurrent ? "auto" : "none",
                                }}
                                onLoad={isCurrent ? () => { setPreviewLoading(false); setPreviewError(false); } : undefined}
                                onError={isCurrent ? () => { setPreviewLoading(false); setPreviewError(true); } : undefined}
                              />
                            );
                          })}
                        </div>
                        <div className="mt-1.5 text-[10px] text-muted-foreground/60 text-center">
                          ↑↓ naviguer &middot; Enter/a ajouter &middot; Esc fermer
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-1 font-medium text-muted-foreground">Nom</th>
                          <th className="pb-1 font-medium text-muted-foreground">URL</th>
                          <th className="pb-1 font-medium text-muted-foreground">Grade</th>
                          <th className="pb-1 font-medium text-muted-foreground">Tel</th>
                          <th className="pb-1 font-medium text-muted-foreground">Email</th>
                          <th className="pb-1 font-medium text-muted-foreground text-center">Issues</th>
                          <th className="pb-1 font-medium text-muted-foreground text-right">Temps</th>
                          <th className="pb-1 text-right"></th>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="pb-2 pr-2 pt-1">
                            <input
                              type="text"
                              placeholder="Filtrer..."
                              value={filterName}
                              onChange={(e) => setFilterName(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input
                              type="text"
                              placeholder="Filtrer..."
                              value={filterUrl}
                              onChange={(e) => setFilterUrl(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setGradeSortDir((d) => d === "asc" ? "desc" : d === "desc" ? null : "asc")}
                                className="text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                {gradeSortDir === "asc" ? "▲" : gradeSortDir === "desc" ? "▼" : "Tri"}
                              </button>
                              <input
                                type="number"
                                placeholder="Min"
                                value={filterScoreMin}
                                onChange={(e) => setFilterScoreMin(e.target.value)}
                                className="w-12 text-xs font-normal px-1 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                                min="0" max="100"
                              />
                              <input
                                type="number"
                                placeholder="Max"
                                value={filterScoreMax}
                                onChange={(e) => setFilterScoreMax(e.target.value)}
                                className="w-12 text-xs font-normal px-1 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                                min="0" max="100"
                              />
                            </div>
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input
                              type="text"
                              placeholder="Filtrer..."
                              value={filterPhone}
                              onChange={(e) => setFilterPhone(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input
                              type="text"
                              placeholder="Filtrer..."
                              value={filterEmail}
                              onChange={(e) => setFilterEmail(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </th>
                          <th className="pb-2 pr-2 pt-1 text-center">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filterIssuesMin}
                              onChange={(e) => setFilterIssuesMin(e.target.value)}
                              className="w-16 text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary mx-auto"
                              min="0"
                            />
                          </th>
                          <th className="pb-2 pt-1"></th>
                          <th className="pb-2 pt-1 text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((r, i) => {
                          const gradeInfo = GRADES[r.grade as keyof typeof GRADES];
                          const isFailed = r.failed;
                          const isExpanded = expandedRow === i;
                          return (
                            <React.Fragment key={i}>
                              <tr className={`border-b border-border/50 last:border-0 ${isFailed ? "opacity-50" : ""}`}>
                                <td className="py-2.5 pr-3 font-medium max-w-[200px] truncate">
                                  {isFailed ? (
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                      <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                                      {r.name}
                                    </span>
                                  ) : r.name}
                                </td>
                                <td className="py-2.5 pr-3">
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`hover:underline max-w-[180px] truncate block ${isFailed ? "text-muted-foreground" : "text-primary"}`}
                                  >
                                    {new URL(r.url).hostname}
                                  </a>
                                </td>
                                <td className="py-2.5 pr-3">
                                  {isFailed ? (
                                    <span className="text-xs text-destructive">{r.failReason}</span>
                                  ) : gradeInfo ? (
                                    <button
                                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                                      className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      <Badge
                                        variant="outline"
                                        className="text-xs font-bold border-0 tabular-nums"
                                        style={{ color: gradeInfo.color, backgroundColor: gradeInfo.color + "15" }}
                                      >
                                        {r.grade} {r.score != null ? r.score : ""}
                                      </Badge>
                                      <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </button>
                                  ) : null}
                                </td>
                                <td className="py-2.5 pr-3 text-muted-foreground">{r.phone}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground max-w-[150px] truncate">{r.email}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground text-center">{isFailed ? "—" : r.issues.length}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground text-right text-xs tabular-nums">
                                  {formatDuration(r.durationMs)}
                                </td>
                                <td className="py-2.5 text-right">
                                  {!isFailed && (
                                    addedUrls.has(r.url) ? (
                                      <span className="text-xs text-muted-foreground">Déjà ajouté</span>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => handleAdd(r)}>
                                        Ajouter
                                      </Button>
                                    )
                                  )}
                                </td>
                              </tr>
                              {isExpanded && !isFailed && r.categoryScores && (
                                <tr className="border-b border-border/50">
                                  <td colSpan={8} className="py-3 px-4 bg-muted/30">
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                      {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
                                        const cat = CATEGORIES[key];
                                        const val = r.categoryScores?.[key] ?? 0;
                                        const pct = Math.round((val / cat.max) * 100);
                                        return (
                                          <div key={key} className="text-center">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{cat.label}</div>
                                            <div className="text-sm font-bold tabular-nums" style={{ color: cat.color }}>{val}<span className="text-xs font-normal text-muted-foreground">/{cat.max}</span></div>
                                            <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )
                ) : mode === "req" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-1 font-medium text-muted-foreground">Nom</th>
                          <th className="pb-1 font-medium text-muted-foreground">NEQ</th>
                          <th className="pb-1 font-medium text-muted-foreground">Ville</th>
                          <th className="pb-1 font-medium text-muted-foreground">Activité</th>
                          <th className="pb-1 font-medium text-muted-foreground">Employés</th>
                          <th className="pb-1 font-medium text-muted-foreground">Tel</th>
                          <th className="pb-1 font-medium text-muted-foreground">Email</th>
                          <th className="pb-1 font-medium text-muted-foreground">Site web</th>
                          <th className="pb-1"></th>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterReqName} onChange={(e) => setFilterReqName(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pt-1"></th>
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterReqCity} onChange={(e) => setFilterReqCity(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterReqActivity} onChange={(e) => setFilterReqActivity(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterReqEmployees} onChange={(e) => setFilterReqEmployees(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pt-1"></th>
                          <th className="pb-2 pt-1"></th>
                          <th className="pb-2 pt-1"></th>
                          <th className="pb-2 pt-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReq.map((r) => {
                          const isExpanded = expandedReqRow === r.neq;
                          return (
                            <React.Fragment key={r.neq}>
                              <tr className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                                  onClick={() => setExpandedReqRow(isExpanded ? null : r.neq)}>
                                <td className="py-2.5 pr-3 font-medium text-foreground max-w-[200px] truncate">
                                  <span className="flex items-center gap-1">
                                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                                    {r.name}
                                    {r.faillite && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-medium border-0 text-destructive bg-destructive/10 ml-1">Faillite</Badge>}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-3 text-muted-foreground text-xs tabular-nums">{r.neq}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground">{r.city || "—"}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground max-w-[200px] truncate">{r.activityDesc || "—"}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground text-xs">{r.employeeLabel || "—"}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground text-xs">{r.phone || "—"}</td>
                                <td className="py-2.5 pr-3 text-muted-foreground text-xs max-w-[150px] truncate">{r.email || "—"}</td>
                                <td className="py-2.5 pr-3" onClick={(e) => e.stopPropagation()}>
                                  {r.url ? (
                                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline max-w-[150px] truncate block">
                                      {(() => { try { return new URL(r.url).hostname; } catch { return r.url; } })()}
                                    </a>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs px-2"
                                      disabled={reqSearching.has(r.neq)}
                                      onClick={() => handleReqSearchSite(r.neq, r.name, r.city)}
                                    >
                                      {reqSearching.has(r.neq) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <><Search className="w-3 h-3 mr-1" />Chercher</>
                                      )}
                                    </Button>
                                  )}
                                </td>
                                <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                                  {addedUrls.has(r.neq) ? (
                                    <span className="text-xs text-muted-foreground">Déjà ajouté</span>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleAddReq(r)}>
                                      Ajouter
                                    </Button>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="border-b border-border/50">
                                  <td colSpan={9} className="py-3 px-4 bg-muted/30">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Forme juridique</span>
                                        <div className="font-medium text-foreground">{r.formeJuridique || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Date immatriculation</span>
                                        <div className="font-medium text-foreground">{r.dateImmat || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Date constitution</span>
                                        <div className="font-medium text-foreground">{r.dateConstitution || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Lieu constitution</span>
                                        <div className="font-medium text-foreground">{r.lieuConstitution || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Adresse complète</span>
                                        <div className="font-medium text-foreground">{r.address || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Code postal</span>
                                        <div className="font-medium text-foreground">{r.postalCode || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Employés (code)</span>
                                        <div className="font-medium text-foreground">{r.employeeLabel ? `${r.employeeLabel} (${r.employeeBracket})` : "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Faillite</span>
                                        <div className={`font-medium ${r.faillite ? "text-destructive" : "text-foreground"}`}>{r.faillite ? "Oui" : "Non"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Activité principale</span>
                                        <div className="font-medium text-foreground">{r.activityDesc || "—"} {r.activityCode ? `(${r.activityCode})` : ""}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Activité secondaire</span>
                                        <div className="font-medium text-foreground">{r.activityDesc2 || "—"} {r.activityCode2 ? `(${r.activityCode2})` : ""}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Dernière déclaration</span>
                                        <div className="font-medium text-foreground">{r.anDeclaration || "—"}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Année production</span>
                                        <div className="font-medium text-foreground">{r.anProduction || "—"}</div>
                                      </div>
                                      {r.objetSocial && (
                                        <div className="col-span-2 sm:col-span-4">
                                          <span className="text-muted-foreground">Objet social</span>
                                          <div className="font-medium text-foreground">{r.objetSocial}</div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {mode === "maps" && (
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          className={`text-xs px-3 py-1 rounded-md transition-colors ${
                            mapsShowAll ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => setMapsShowAll(true)}
                        >
                          Tous ({noSiteResults.length})
                        </button>
                        <button
                          className={`text-xs px-3 py-1 rounded-md transition-colors ${
                            !mapsShowAll ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => setMapsShowAll(false)}
                        >
                          Sans site ({noSiteResults.filter(r => !r.hasWebsite).length})
                        </button>
                      </div>
                    )}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-1 font-medium text-muted-foreground">Nom</th>
                          <th className="pb-1 font-medium text-muted-foreground">Adresse</th>
                          <th className="pb-1 font-medium text-muted-foreground">Tel</th>
                          {mode === "maps" && <th className="pb-1 font-medium text-muted-foreground text-center">Site</th>}
                          {mode === "maps" && <th className="pb-1 font-medium text-muted-foreground text-center">Avis</th>}
                          <th className="pb-1 font-medium text-muted-foreground">Source</th>
                          <th className="pb-1"></th>
                        </tr>
                        <tr className="border-b border-border/50">
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterNsName} onChange={(e) => setFilterNsName(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterNsAddress} onChange={(e) => setFilterNsAddress(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterNsPhone} onChange={(e) => setFilterNsPhone(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          {mode === "maps" && <th className="pb-2 pt-1"></th>}
                          {mode === "maps" && <th className="pb-2 pt-1"></th>}
                          <th className="pb-2 pr-2 pt-1">
                            <input type="text" placeholder="Filtrer..." value={filterNsSource} onChange={(e) => setFilterNsSource(e.target.value)}
                              className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                          </th>
                          <th className="pb-2 pt-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNoSite.map((r, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-3 font-medium text-foreground max-w-[200px] truncate">
                              {r.name}
                            </td>
                            <td className="py-2.5 pr-3 text-muted-foreground max-w-[200px] truncate">
                              {r.address || "—"}
                            </td>
                            <td className="py-2.5 pr-3 text-muted-foreground">{r.phone || "—"}</td>
                            {mode === "maps" && (
                              <td className="py-2.5 pr-3 text-center">
                                {r.hasWebsite ? (
                                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                    <Globe className="w-3.5 h-3.5 inline" />
                                  </a>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border-0 text-destructive bg-destructive/10">
                                    Aucun
                                  </Badge>
                                )}
                              </td>
                            )}
                            {mode === "maps" && (
                              <td className="py-2.5 pr-3 text-center">
                                {r.rating ? (
                                  <span className="flex items-center justify-center gap-1 text-xs">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className="text-foreground font-medium">{r.rating}</span>
                                    {r.reviewCount != null && <span className="text-muted-foreground">({r.reviewCount})</span>}
                                  </span>
                                ) : <span className="text-muted-foreground text-xs">—</span>}
                              </td>
                            )}
                            <td className="py-2.5 pr-3">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                {r.source}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <Button size="sm" variant="outline" onClick={() => handleAddNoSite(r)}>
                                Ajouter
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* History tab */
        <Card className="shadow-sm border-0">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground tracking-wider uppercase mb-4 font-medium">
              Historique des scans ({filteredHistory.length}/{history.length})
            </div>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground/50">Aucun scan effectué</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {([
                        ["date", "Date"], ["env", "Env"], ["sector", "Secteur"], ["region", "Région"],
                        ["urls", "URLs"], ["success", "Réussis"], ["fails", "Échecs"], ["duration", "Durée"],
                      ] as const).map(([key, label]) => (
                        <th
                          key={key}
                          className="pb-2 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => {
                            if (historySortCol === key) {
                              if (historySortDir === "asc") setHistorySortDir("desc");
                              else { setHistorySortCol(null); setHistorySortDir("asc"); }
                            } else {
                              setHistorySortCol(key);
                              setHistorySortDir("asc");
                            }
                          }}
                        >
                          {label} {historySortCol === key ? (historySortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                      ))}
                      <th className="pb-2 font-medium text-muted-foreground">Grades</th>
                    </tr>
                    <tr className="border-b border-border/50">
                      <th className="pb-2 pt-1"></th>
                      <th className="pb-2 pr-2 pt-1">
                        <input type="text" placeholder="Filtrer..." value={filterHEnv} onChange={(e) => setFilterHEnv(e.target.value)}
                          className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                      </th>
                      <th className="pb-2 pr-2 pt-1">
                        <input type="text" placeholder="Filtrer..." value={filterHSector} onChange={(e) => setFilterHSector(e.target.value)}
                          className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                      </th>
                      <th className="pb-2 pr-2 pt-1">
                        <input type="text" placeholder="Filtrer..." value={filterHRegion} onChange={(e) => setFilterHRegion(e.target.value)}
                          className="w-full text-xs font-normal px-1.5 py-1 rounded border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                      </th>
                      <th className="pb-2 pt-1"></th>
                      <th className="pb-2 pt-1"></th>
                      <th className="pb-2 pt-1"></th>
                      <th className="pb-2 pt-1"></th>
                      <th className="pb-2 pt-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((h) => (
                      <tr key={h.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleDateString("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" })}{" "}
                          <span className="text-muted-foreground/70">{new Date(h.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td className="py-2.5 pr-3">
                          {h.env === "local" ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border-0 text-blue-600 bg-blue-500/10">
                              Québec
                            </Badge>
                          ) : h.env === "prod" ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border-0 text-amber-600 bg-amber-500/10">
                              France
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-foreground">{h.sector}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{h.region}</td>
                        <td className="py-2.5 pr-3 text-foreground">{h.urlsFound}</td>
                        <td className="py-2.5 pr-3 text-emerald-600 font-medium">{h.sitesSuccess}</td>
                        <td className="py-2.5 pr-3 text-destructive">
                          {h.sitesScanned - h.sitesSuccess}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                          {formatDuration(h.durationMs)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(h.grades || {})
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([grade, count]) => {
                                const info = GRADES[grade as keyof typeof GRADES];
                                return (
                                  <Badge
                                    key={grade}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 font-bold border-0"
                                    style={{ color: info?.color, backgroundColor: (info?.color || "#888") + "15" }}
                                  >
                                    {grade}:{count}
                                  </Badge>
                                );
                              })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
