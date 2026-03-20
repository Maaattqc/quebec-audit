import type { Business, ScanResult, ScanResponse, ChecklistItems, NoSiteResult, ScanHistoryEntry, Email, Reminder, Attachment, EmailTemplate, LogEntry, ReqResult } from "./types";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any) {
    super(`API ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let data: any = {};
    try { data = await res.json(); } catch {}
    throw new ApiError(res.status, data);
  }
  return res.json();
}

export const api = {
  getBusinesses: () => request<Business[]>("/businesses"),

  createBusiness: (b: Omit<Business, "history">) =>
    request<Business>("/businesses", { method: "POST", body: JSON.stringify(b) }),

  updateBusiness: (id: string, updates: Partial<Business>) =>
    request<Business>(`/businesses/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  deleteBusiness: (id: string) =>
    request<{ ok: true }>(`/businesses/${id}`, { method: "DELETE" }),

  addHistory: (id: string, action: string) =>
    request<{ ts: string; action: string }>(`/businesses/${id}/history`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  scan: (sector: string, region: string, maxResults = 50) =>
    request<ScanResponse>("/scan", {
      method: "POST",
      body: JSON.stringify({ sector, region, maxResults }),
    }),

  getScanHistory: () => request<ScanHistoryEntry[]>("/scan-history"),

  addScanResult: (result: ScanResult) =>
    request<Business>("/scan/add", {
      method: "POST",
      body: JSON.stringify(result),
    }),

  getChecklist: (id: string) =>
    request<ChecklistItems>(`/businesses/${id}/checklist`),

  updateChecklist: (id: string, key: string, checked: boolean) =>
    request<{ ok: true }>(`/businesses/${id}/checklist`, {
      method: "PUT",
      body: JSON.stringify({ key, checked }),
    }),

  scanNoSite: (sector: string, region: string, showAll = false, force = false) =>
    request<NoSiteResult[]>("/scan-no-site", {
      method: "POST",
      body: JSON.stringify({ sector, region, showAll, force }),
    }),

  addNoSiteResult: (result: NoSiteResult) =>
    request<Business>("/scan/add", {
      method: "POST",
      body: JSON.stringify({
        name: result.name,
        url: result.url || "",
        grade: "F",
        phone: result.phone,
        email: result.email,
        issues: ["Aucun site web"],
        sector: "",
      }),
    }),

  // Emails
  getEmails: (params?: { businessId?: string; direction?: string }) => {
    const qs = new URLSearchParams();
    if (params?.businessId) qs.set("business_id", params.businessId);
    if (params?.direction) qs.set("direction", params.direction);
    const q = qs.toString();
    return request<Email[]>(`/emails${q ? "?" + q : ""}`);
  },

  getEmail: (id: number) => request<Email>(`/emails/${id}`),

  sendEmail: (data: { to: string; subject: string; html?: string; text?: string; businessId?: string }) =>
    request<{ id: number; resendId: string; status: string }>("/emails/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Analytics
  getAnalytics: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const q = qs.toString();
    return request<any>(`/analytics${q ? "?" + q : ""}`);
  },

  // Logs
  getLogs: () => request<LogEntry[]>("/logs"),

  // Health
  getHealth: () => request<Record<string, { ok: boolean; detail?: string }>>("/health"),

  getHealthRemote: (url: string) =>
    request<Record<string, { ok: boolean; detail?: string }>>(`/health/remote?url=${encodeURIComponent(url)}`),

  // Reminders
  getReminders: (businessId?: string) => {
    const qs = businessId ? `?business_id=${businessId}` : "";
    return request<Reminder[]>(`/reminders${qs}`);
  },

  createReminder: (data: { businessId: string; dueDate: string; note: string }) =>
    request<Reminder>("/reminders", { method: "POST", body: JSON.stringify(data) }),

  updateReminder: (id: number, data: Partial<Reminder>) =>
    request<Reminder>(`/reminders/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteReminder: (id: number) =>
    request<{ ok: true }>(`/reminders/${id}`, { method: "DELETE" }),

  // Email Templates
  getEmailTemplates: () => request<EmailTemplate[]>("/email-templates"),

  createEmailTemplate: (data: { name: string; subject: string; body: string }) =>
    request<EmailTemplate>("/email-templates", { method: "POST", body: JSON.stringify(data) }),

  updateEmailTemplate: (id: number, data: Partial<EmailTemplate>) =>
    request<EmailTemplate>(`/email-templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteEmailTemplate: (id: number) =>
    request<{ ok: true }>(`/email-templates/${id}`, { method: "DELETE" }),

  // Bulk operations
  bulkUpdateBusinesses: (ids: string[], updates: Partial<Business>) =>
    request<{ ok: true }>("/businesses/bulk", { method: "PUT", body: JSON.stringify({ ids, updates }) }),

  bulkDeleteBusinesses: (ids: string[]) =>
    request<{ ok: true }>("/businesses/bulk", { method: "DELETE", body: JSON.stringify({ ids }) }),

  // Rescan
  rescanBusiness: (id: string) =>
    request<Business>(`/businesses/${id}/rescan`, { method: "POST" }),

  // Attachments
  getAttachments: (businessId: string) =>
    request<Attachment[]>(`/businesses/${businessId}/attachments`),

  uploadAttachment: (businessId: string, file: File): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        request<Attachment>(`/businesses/${businessId}/attachments`, {
          method: "POST",
          body: JSON.stringify({ filename: file.name, mimeType: file.type || "application/octet-stream", data: base64 }),
        }).then(resolve).catch(reject);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  downloadAttachmentUrl: (id: number) => `${BASE}/attachments/${id}/download`,

  siteProxyUrl: (url: string) => `${BASE}/site-proxy?url=${encodeURIComponent(url)}`,

  deleteAttachment: (id: number) =>
    request<{ ok: true }>(`/attachments/${id}`, { method: "DELETE" }),

  // Registre QC (REQ)
  getReqCities: () => request<{ city: string; count: number }[]>("/req-cities"),

  scanReq: (sector: string, region: string, limit?: number) =>
    request<ReqResult[]>("/scan-req", { method: "POST", body: JSON.stringify({ sector, region, limit }) }),

  reqSearchSite: (name: string, city: string, neq?: string) =>
    request<{ url: string; found: boolean; phone: string; email: string }>("/req-search-site", { method: "POST", body: JSON.stringify({ name, city, neq }) }),
};
