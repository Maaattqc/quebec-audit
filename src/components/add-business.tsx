import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Business } from "@/lib/types";
import { GRADES } from "@/lib/types";
import { ApiError } from "@/lib/api";

interface AddBusinessProps {
  onAdd: (biz: Omit<Business, "history">) => Promise<void>;
  saving: boolean;
}

export function AddBusiness({ onAdd, saving }: AddBusinessProps) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    sector: "",
    phone: "",
    email: "",
    grade: "C" as Business["grade"],
    notes: "",
  });
  const [duplicate, setDuplicate] = useState<{ id: string; name: string; url: string } | null>(null);

  const handleSubmit = async () => {
    if (!form.name) return;
    setDuplicate(null);
    const id = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    try {
      await onAdd({
        ...form,
        id,
        contacts: [],
        status: "prospect",
        issues: [],
        improvements: [],
        estimatedValue: "À estimer",
        hasDemo: false,
        demoNotes: "",
      });
      setForm({
        name: "",
        url: "",
        sector: "",
        phone: "",
        email: "",
        grade: "C",
        notes: "",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.data?.existing) {
        setDuplicate(err.data.existing);
      }
    }
  };

  const fields = [
    { key: "name" as const, label: "Nom", ph: "Ex: Toiture ABC" },
    { key: "url" as const, label: "Site web", ph: "https://..." },
    { key: "sector" as const, label: "Secteur", ph: "Ex: Toiture, Plomberie..." },
    { key: "phone" as const, label: "Téléphone", ph: "(418) 000-0000" },
    { key: "email" as const, label: "Email", ph: "info@..." },
  ];

  return (
    <div className="max-w-[560px] animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Nouvelle entreprise
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Ajouter un prospect au pipeline
      </p>

      {duplicate && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
          <span className="text-amber-600 font-medium">Cette entreprise existe déjà :</span>{" "}
          <span className="text-foreground">{duplicate.name}</span>
          {duplicate.url && (
            <span className="text-muted-foreground ml-1">({duplicate.url})</span>
          )}
        </div>
      )}

      <Card className="shadow-sm border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <Label className="text-sm text-foreground/70 font-medium mb-1.5 block">
                  {f.label}
                </Label>
                <Input
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  placeholder={f.ph}
                  className="h-10 text-base bg-muted/30 border-muted focus:bg-card transition-colors"
                />
              </div>
            ))}
            <div>
              <Label className="text-sm text-foreground/70 font-medium mb-1.5 block">
                Note du site
              </Label>
              <Select
                value={form.grade}
                onValueChange={(v) =>
                  setForm({ ...form, grade: v as Business["grade"] })
                }
              >
                <SelectTrigger className="h-10 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GRADES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {k} — {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-foreground/70 font-medium mb-1.5 block">
                Notes
              </Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Problèmes observés, contexte..."
                rows={3}
                className="resize-y text-base bg-muted/30 border-muted focus:bg-card transition-colors"
              />
            </div>
            <Button
              className="w-full h-10 text-base font-medium shadow-sm shadow-primary/20 mt-2"
              onClick={handleSubmit}
              disabled={saving}
            >
              Ajouter au pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
