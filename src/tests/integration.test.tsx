import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import type { Business } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------

const { apiMocks } = vi.hoisted(() => {
  const mockBusinesses: Business[] = [
    {
      id: "integ-1",
      name: "Toiture Beauce",
      url: "https://toiture-beauce.com",
      sector: "Toiture",
      grade: "D",
      phone: "(418) 333-3333",
      email: "info@toiture-beauce.com",
      contacts: [],
      status: "prospect",
      notes: "",
      issues: ["Site très vieux", "Pas responsive"],
      improvements: ["Refonte complète", "SEO local"],
      estimatedValue: "4 000$",
      hasDemo: true,
      demoNotes: "Maquette faite",
      history: [],
    },
  ];

  return {
    apiMocks: {
      getBusinesses: vi.fn(() => Promise.resolve([...mockBusinesses])),
      createBusiness: vi.fn((b: any) =>
        Promise.resolve({ ...b, history: [{ ts: "2026-03-06 14:00", action: "Entreprise ajoutée" }] })
      ),
      updateBusiness: vi.fn((id: string, updates: any) => {
        const biz = mockBusinesses.find((b) => b.id === id)!;
        return Promise.resolve({ ...biz, ...updates });
      }),
      deleteBusiness: vi.fn(() => Promise.resolve({ ok: true })),
      addHistory: vi.fn((_id: string, action: string) =>
        Promise.resolve({ ts: "2026-03-06 14:00", action })
      ),
      scan: vi.fn(() => Promise.resolve({ results: [], stats: { urlsFound: 0, sitesScanned: 0, sitesSuccess: 0, durationMs: 0, grades: {} } })),
      addScanResult: vi.fn(() => Promise.resolve(mockBusinesses[0])),
      scanNoSite: vi.fn(() => Promise.resolve([])),
      addNoSiteResult: vi.fn(() => Promise.resolve(mockBusinesses[0])),
      getChecklist: vi.fn(() => Promise.resolve({})),
      updateChecklist: vi.fn(() => Promise.resolve({ ok: true })),
      getScanHistory: vi.fn(() => Promise.resolve([])),
      getEmails: vi.fn(() => Promise.resolve([])),
      getEmail: vi.fn(() => Promise.resolve({})),
      sendEmail: vi.fn(() => Promise.resolve({ id: 1, resendId: "r1", status: "sent" })),
      getAnalytics: vi.fn(() => Promise.resolve({
        pipeline: {}, totalBusinesses: 0, totalValue: 0, mrr: 0,
        grades: {}, emails: { total: 0, sent: 0, received: 0, linkedBusinesses: 0 },
        scans: { totalScans: 0, totalUrls: 0, totalSuccess: 0, totalDurationMs: 0 },
        conversion: { contacted: 0, won: 0, lost: 0, conversionRate: 0, closeRate: 0 },
        recentActivity: [], timeline: [], topSectors: [],
      })),
      getHealth: vi.fn(() => Promise.resolve({})),
      getHealthRemote: vi.fn(() => Promise.resolve({})),
      getLogs: vi.fn(() => Promise.resolve([])),
      getReminders: vi.fn(() => Promise.resolve([])),
      createReminder: vi.fn(() => Promise.resolve({ id: 1, businessId: "integ-1", dueDate: "2026-03-10", note: "", done: false, createdAt: "" })),
      updateReminder: vi.fn(() => Promise.resolve({})),
      deleteReminder: vi.fn(() => Promise.resolve({ ok: true })),
      getEmailTemplates: vi.fn(() => Promise.resolve([])),
      createEmailTemplate: vi.fn(() => Promise.resolve({ id: 1, name: "Test", subject: "", body: "test", createdAt: "" })),
      updateEmailTemplate: vi.fn(() => Promise.resolve({})),
      deleteEmailTemplate: vi.fn(() => Promise.resolve({ ok: true })),
      bulkUpdateBusinesses: vi.fn(() => Promise.resolve({ ok: true })),
      bulkDeleteBusinesses: vi.fn(() => Promise.resolve({ ok: true })),
      rescanBusiness: vi.fn(() => Promise.resolve({})),
      getAttachments: vi.fn(() => Promise.resolve([])),
      uploadAttachment: vi.fn(() => Promise.resolve({})),
      downloadAttachmentUrl: vi.fn(() => "/api/attachments/1/download"),
      siteProxyUrl: vi.fn((url: string) => `/api/site-proxy?url=${encodeURIComponent(url)}`),
      deleteAttachment: vi.fn(() => Promise.resolve({ ok: true })),
      getReqCities: vi.fn(() => Promise.resolve([])),
      scanReq: vi.fn(() => Promise.resolve([])),
      reqSearchSite: vi.fn(() => Promise.resolve({ url: "", found: false, phone: "", email: "" })),
    },
  };
});

vi.mock("@/lib/api", () => ({ api: apiMocks, ApiError: class extends Error { status: number; data: any; constructor(s: number, d: any) { super(`API ${s}`); this.status = s; this.data = d; } } }));

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderApp() {
  render(<App />);
  await waitFor(() => {
    expect(screen.getAllByText("Toiture Beauce").length).toBeGreaterThan(0);
  });
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe("Add new business flow", () => {
  it("creates a business via the API", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByText("Nouveau"));
    await waitFor(() => screen.getByText("Nouvelle entreprise"));

    await user.type(screen.getByPlaceholderText("Ex: Toiture ABC"), "Plomberie Pro");
    await user.type(screen.getByPlaceholderText("https://..."), "https://plomberie-pro.com");
    await user.type(screen.getByPlaceholderText("Ex: Toiture, Plomberie..."), "Plomberie");
    await user.type(screen.getByPlaceholderText("(418) 000-0000"), "(418) 444-4444");
    await user.type(screen.getByPlaceholderText("info@..."), "contact@plomberie-pro.com");

    await user.click(screen.getByText("Ajouter au pipeline"));

    await waitFor(() => {
      expect(apiMocks.createBusiness).toHaveBeenCalledOnce();
      const call = apiMocks.createBusiness.mock.calls[0][0];
      expect(call.name).toBe("Plomberie Pro");
      expect(call.url).toBe("https://plomberie-pro.com");
      expect(call.sector).toBe("Plomberie");
      expect(call.status).toBe("prospect");
    });
  });
});

describe("Status change flow", () => {
  it("marks business as contacted", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByText("Message"));
    await waitFor(() => screen.getByText(/Pour : Toiture Beauce/));

    await user.click(screen.getByText("Marquer contacté"));

    await waitFor(() => {
      expect(apiMocks.updateBusiness).toHaveBeenCalledWith("integ-1", { status: "contacted" });
      expect(apiMocks.addHistory).toHaveBeenCalledWith("integ-1", expect.stringContaining("Email envoyé"));
    });
  });

  it("marks demo as sent", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByText("Message"));
    await waitFor(() => screen.getByText("Démo envoyée"));

    await user.click(screen.getByText("Démo envoyée"));

    await waitFor(() => {
      expect(apiMocks.updateBusiness).toHaveBeenCalledWith("integ-1", { status: "demo_sent" });
      expect(apiMocks.addHistory).toHaveBeenCalledWith("integ-1", "Démo envoyée");
    });
  });
});

describe("Message copy flow", () => {
  it("copies email and logs history", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    await renderApp();

    await user.click(screen.getByText("Message"));
    await waitFor(() => screen.getByText("Copier"));

    await user.click(screen.getByText("Copier"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain("toiture-beauce.com");
      expect(apiMocks.addHistory).toHaveBeenCalledWith("integ-1", "Message email copié");
    });
  });
});

describe("Pipeline kanban view", () => {
  it("shows businesses in pipeline", async () => {
    await renderApp();
    expect(screen.getAllByText("Pipeline").length).toBeGreaterThan(0);
  });

  it("clicking pipeline card navigates to detail", async () => {
    const user = userEvent.setup();
    await renderApp();

    const cards = screen.getAllByText("Toiture Beauce");
    await user.click(cards[1]);

    await waitFor(() => {
      expect(screen.getByText("https://toiture-beauce.com")).toBeInTheDocument();
    });
  });
});

describe("API error handling", () => {
  it("renders with empty business list", async () => {
    apiMocks.getBusinesses.mockResolvedValueOnce([]);
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText("Pipeline").length).toBeGreaterThan(0);
      expect(screen.getByText(/0 entreprises/)).toBeInTheDocument();
    });
  });
});
