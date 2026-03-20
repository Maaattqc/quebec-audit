import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Business, Email as EmailType } from "@/lib/types";
import { api } from "@/lib/api";

interface EmailProps {
  businesses: Business[];
  selectedBusiness?: Business;
}

export function Email({ businesses, selectedBusiness }: EmailProps) {
  const [emails, setEmails] = useState<EmailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "received" | "sent">("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailType | null>(null);
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"" | "success" | "error">("");

  // Compose form
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [linkedBizId, setLinkedBizId] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const fetchEmails = (showLoader = false) => {
    if (showLoader) setLoading(true);
    const params = filter === "all" ? undefined : { direction: filter };
    api.getEmails(params).then(setEmails).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmails(true);
    const interval = setInterval(() => fetchEmails(), 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const openCompose = (biz?: Business) => {
    setComposing(true);
    setSelectedEmail(null);
    setSendStatus("");
    if (biz) {
      setTo(biz.email);
      setLinkedBizId(biz.id);
      setSubject(`Votre site web — ${biz.name}`);
    } else {
      setTo("");
      setLinkedBizId("");
      setSubject("");
    }
    setBody("");
    setTimeout(() => bodyRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!to || !subject) return;
    setSending(true);
    setSendStatus("");
    try {
      await api.sendEmail({
        to,
        subject,
        html: body.replace(/\n/g, "<br>"),
        text: body,
        businessId: linkedBizId,
      });
      setSendStatus("success");
      setTo("");
      setSubject("");
      setBody("");
      setLinkedBizId("");
      fetchEmails();
      setTimeout(() => { setComposing(false); setSendStatus(""); }, 1500);
    } catch {
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  };

  const getBizName = (bizId: string) => {
    if (!bizId) return null;
    const biz = businesses.find(b => b.id === bizId);
    return biz?.name || null;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
      return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
    } catch { return iso; }
  };

  const filtered = emails;

  return (
    <div className="max-w-[960px] animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Emails</h2>
          <p className="text-sm text-muted-foreground">
            {emails.length} message{emails.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="text-sm h-9 shadow-sm shadow-primary/20"
          onClick={() => openCompose(selectedBusiness)}
        >
          + Nouveau message
        </Button>
      </div>

      {/* Filter toggle */}
      <div className="inline-flex gap-1 p-1 bg-muted/60 rounded-lg mb-5">
        {([
          ["all", "Tous"],
          ["received", "Reçus"],
          ["sent", "Envoyés"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            className={`text-sm px-4 py-1.5 rounded-md transition-all duration-150 ${
              filter === k
                ? "bg-card text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setFilter(k); setSelectedEmail(null); }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Compose form */}
      {composing && (
        <Card className="mb-5 shadow-sm border-0 border-l-[3px] border-l-primary/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-muted-foreground tracking-wider uppercase font-medium">
                Nouveau message
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setComposing(false)}
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">À</label>
                  <Input
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="email@exemple.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="w-48">
                  <label className="text-xs text-muted-foreground mb-1 block">Lié à</label>
                  <select
                    value={linkedBizId}
                    onChange={e => {
                      setLinkedBizId(e.target.value);
                      if (e.target.value && !to) {
                        const biz = businesses.find(b => b.id === e.target.value);
                        if (biz?.email) setTo(biz.email);
                      }
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">— Aucun —</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Objet</label>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Objet du message"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                <Textarea
                  ref={bodyRef}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Bonjour,&#10;&#10;..."
                  className="min-h-[200px] text-sm leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-muted-foreground">
                  De : <span className="text-foreground">demo@mathieu-fournier.net</span>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!to || !subject || sending}
                  className={`text-sm h-9 min-w-[120px] transition-all duration-200 ${
                    sendStatus === "success"
                      ? "bg-green-600 hover:bg-green-600"
                      : sendStatus === "error"
                        ? "bg-destructive hover:bg-destructive"
                        : ""
                  }`}
                >
                  {sending ? "Envoi..." : sendStatus === "success" ? "Envoyé" : sendStatus === "error" ? "Erreur" : "Envoyer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email list */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm border-0">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground text-sm">
              {filter === "received" ? "Aucun message reçu" : filter === "sent" ? "Aucun message envoyé" : "Aucun message"}
            </div>
            <Button
              variant="outline"
              className="mt-4 text-sm h-9"
              onClick={() => openCompose(selectedBusiness)}
            >
              Envoyer un premier message
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {filtered.map(email => {
            const isSelected = selectedEmail?.id === email.id;
            const isIncoming = email.direction === "received";
            const bizName = getBizName(email.businessId);

            return (
              <div key={email.id}>
                <button
                  onClick={() => setSelectedEmail(isSelected ? null : email)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 group ${
                    isSelected
                      ? "bg-card shadow-sm"
                      : "hover:bg-card/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Direction indicator */}
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      isIncoming ? "bg-blue-500" : "bg-emerald-500"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm truncate ${
                            isSelected ? "text-foreground font-medium" : "text-foreground/80"
                          }`}>
                            {isIncoming ? email.from : email.to}
                          </span>
                          {bizName && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 font-normal border-border/50 shrink-0"
                            >
                              {bizName}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {formatDate(email.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 font-normal border-0 rounded-full shrink-0 ${
                            isIncoming
                              ? "text-blue-400 bg-blue-500/10"
                              : "text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {isIncoming ? "Reçu" : "Envoyé"}
                        </Badge>
                        <span className="text-sm text-muted-foreground truncate">
                          {email.subject || "(sans objet)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded email content */}
                {isSelected && (
                  <Card className="mx-2 mb-2 shadow-sm border-0 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {email.subject || "(sans objet)"}
                          </h3>
                          <div className="text-xs text-muted-foreground mt-1">
                            De : <span className="text-foreground/70">{email.from}</span>
                            <span className="mx-2">→</span>
                            À : <span className="text-foreground/70">{email.to}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isIncoming && (
                            <Button
                              variant="outline"
                              className="text-xs h-7 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                setComposing(true);
                                setTo(email.from);
                                setSubject(email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`);
                                setLinkedBizId(email.businessId || "");
                                setBody("");
                              }}
                            >
                              Répondre
                            </Button>
                          )}
                        </div>
                      </div>

                      <Separator className="mb-4" />

                      {email.bodyHtml ? (
                        <div
                          className="prose prose-sm prose-invert max-w-none text-foreground/80 [&_a]:text-primary [&_img]:rounded-md"
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                        />
                      ) : (
                        <pre className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                          {email.bodyText || "(vide)"}
                        </pre>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
