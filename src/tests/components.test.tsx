import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import type { Business } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------

const mockBusinesses: Business[] = [
  {
    id: "test-1",
    name: "Entreprise Alpha",
    url: "https://alpha.com",
    sector: "Construction",
    grade: "A",
    phone: "(418) 111-1111",
    email: "info@alpha.com",
    contacts: [{ name: "Alice", role: "Directrice", phone: "(418) 111-2222" }],
    status: "prospect",
    notes: "",
    issues: ["Problème 1", "Problème 2"],
    improvements: ["Amélioration 1", "Amélioration 2"],
    estimatedValue: "3 000$",
    hasDemo: true,
    demoNotes: "Démo prête",
    history: [{ ts: "2026-03-01 10:00", action: "Créée" }],
  },
  {
    id: "test-2",
    name: "Entreprise Beta",
    url: "https://beta.com",
    sector: "Électricité",
    grade: "C",
    phone: "(418) 222-2222",
    email: "info@beta.com",
    contacts: [],
    status: "contacted",
    notes: "Intéressé",
    issues: ["Site lent"],
    improvements: ["Refonte"],
    estimatedValue: "1 500$",
    hasDemo: false,
    demoNotes: "",
    history: [],
  },
];

vi.mock("@/lib/api", () => ({
  api: {
    getBusinesses: vi.fn(() => Promise.resolve(mockBusinesses)),
    createBusiness: vi.fn((b: any) =>
      Promise.resolve({ ...b, history: [{ ts: "2026-03-06 12:00", action: "Entreprise ajoutée" }] })
    ),
    updateBusiness: vi.fn((id: string, updates: any) => {
      const biz = mockBusinesses.find((b) => b.id === id)!;
      return Promise.resolve({ ...biz, ...updates });
    }),
    deleteBusiness: vi.fn(() => Promise.resolve({ ok: true })),
    addHistory: vi.fn((_id: string, action: string) =>
      Promise.resolve({ ts: "2026-03-06 12:00", action })
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
    createReminder: vi.fn(() => Promise.resolve({ id: 1, businessId: "test-1", dueDate: "2026-03-10", note: "", done: false, createdAt: "" })),
    updateReminder: vi.fn(() => Promise.resolve({})),
    deleteReminder: vi.fn(() => Promise.resolve({ ok: true })),
    getEmailTemplates: vi.fn(() => Promise.resolve([])),
    createEmailTemplate: vi.fn(() => Promise.resolve({ id: 1, name: "Test", subject: "", body: "test", createdAt: "" })),
    updateEmailTemplate: vi.fn(() => Promise.resolve({})),
    deleteEmailTemplate: vi.fn(() => Promise.resolve({ ok: true })),
    bulkUpdateBusinesses: vi.fn(() => Promise.resolve({ ok: true })),
    bulkDeleteBusinesses: vi.fn(() => Promise.resolve({ ok: true })),
    rescanBusiness: vi.fn(() => Promise.resolve(mockBusinesses[0])),
    getAttachments: vi.fn(() => Promise.resolve([])),
    uploadAttachment: vi.fn(() => Promise.resolve({ id: 1, businessId: "test-1", filename: "test.pdf", mimeType: "application/pdf", sizeBytes: 1024, createdAt: "" })),
    downloadAttachmentUrl: vi.fn(() => "/api/attachments/1/download"),
    siteProxyUrl: vi.fn((url: string) => `/api/site-proxy?url=${encodeURIComponent(url)}`),
    deleteAttachment: vi.fn(() => Promise.resolve({ ok: true })),
    getReqCities: vi.fn(() => Promise.resolve([])),
    scanReq: vi.fn(() => Promise.resolve([])),
    reqSearchSite: vi.fn(() => Promise.resolve({ url: "", found: false, phone: "", email: "" })),
  },
  ApiError: class extends Error { status: number; data: any; constructor(s: number, d: any) { super(`API ${s}`); this.status = s; this.data = d; } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderApp() {
  render(<App />);
  await waitFor(() => {
    expect(screen.getAllByText("Entreprise Alpha").length).toBeGreaterThan(0);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("App rendering", () => {
  it("renders businesses after loading", async () => {
    await renderApp();
    expect(screen.getAllByText("Entreprise Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Entreprise Beta").length).toBeGreaterThan(0);
  });

  it("displays the app title", async () => {
    await renderApp();
    expect(screen.getByText("Beauce Web Audit")).toBeInTheDocument();
  });

  it("shows pipeline tab by default", async () => {
    await renderApp();
    expect(screen.getAllByText("Pipeline").length).toBeGreaterThan(0);
  });

  it("displays total business count", async () => {
    await renderApp();
    expect(screen.getByText(/2 entreprises/)).toBeInTheDocument();
  });
});

describe("Sidebar", () => {
  it("shows grades in sidebar", async () => {
    await renderApp();
    const gradeElements = screen.getAllByText("A");
    expect(gradeElements.length).toBeGreaterThan(0);
  });

  it("shows demo indicator for businesses with demo", async () => {
    await renderApp();
    expect(screen.getAllByText("Démo prête").length).toBeGreaterThan(0);
  });

  it("shows status badges", async () => {
    await renderApp();
    expect(screen.getAllByText("Prospect").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contacté").length).toBeGreaterThan(0);
  });
});

describe("Tab navigation", () => {
  it("switches to detail tab", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByText("Fiche"));
    await waitFor(() => {
      expect(screen.getByText("https://alpha.com")).toBeInTheDocument();
    });
  });

  it("switches to compose tab", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByText("Message"));
    await waitFor(() => {
      expect(screen.getByText(/Pour : Entreprise Alpha/)).toBeInTheDocument();
    });
  });

  it("switches to add tab", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByText("Nouveau"));
    await waitFor(() => {
      expect(screen.getByText("Nouvelle entreprise")).toBeInTheDocument();
    });
  });
});

describe("Detail view", () => {
  async function goToDetail() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Fiche"));
    return user;
  }

  it("shows business contacts", async () => {
    await goToDetail();
    await waitFor(() => {
      expect(screen.getByText(/info@alpha.com/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Alice \(Directrice\)/)).toBeInTheDocument();
  });

  it("shows issues and improvements", async () => {
    await goToDetail();
    await waitFor(() => {
      expect(screen.getByText("Problème 1")).toBeInTheDocument();
      expect(screen.getByText("Amélioration 1")).toBeInTheDocument();
    });
  });

  it("shows history", async () => {
    await goToDetail();
    await waitFor(() => {
      expect(screen.getByText("Créée")).toBeInTheDocument();
    });
  });

  it("shows estimated value", async () => {
    await goToDetail();
    await waitFor(() => {
      expect(screen.getByText("3 000$")).toBeInTheDocument();
    });
  });
});

describe("Scanner tab", () => {
  it("shows scanner tab in navigation", async () => {
    await renderApp();
    expect(screen.getByText("Scanner")).toBeInTheDocument();
  });

  it("switches to scanner tab", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Scanner"));
    await waitFor(() => {
      expect(screen.getByText("Audit site web")).toBeInTheDocument();
    });
  });
});

describe("Detail view - checklist and prompt", () => {
  async function goToDetail() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Fiche"));
    return user;
  }

  it("shows checklist section in detail view", async () => {
    await goToDetail();
    await waitFor(() => {
      expect(screen.getByText(/Checklist pre-pitch/)).toBeInTheDocument();
    });
  });

  it("shows prompt generator in detail view", async () => {
    await goToDetail();
    await waitFor(() => {
      expect(screen.getByText("Générer le prompt")).toBeInTheDocument();
    });
  });
});

describe("Compose view", () => {
  async function goToCompose() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Message"));
    return user;
  }

  it("shows recipient email", async () => {
    await goToCompose();
    await waitFor(() => {
      expect(screen.getByText(/info@alpha.com/)).toBeInTheDocument();
    });
  });

  it("has copy button", async () => {
    await goToCompose();
    await waitFor(() => {
      expect(screen.getByText("Copier")).toBeInTheDocument();
    });
  });

  it("shows mark as contacted button", async () => {
    await goToCompose();
    await waitFor(() => {
      expect(screen.getByText("Marquer contacté")).toBeInTheDocument();
    });
  });

  it("shows demo sent button for businesses with demo", async () => {
    await goToCompose();
    await waitFor(() => {
      expect(screen.getByText("Démo envoyée")).toBeInTheDocument();
    });
  });
});

describe("Analytics tab", () => {
  async function goToAnalytics() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Analytics"));
    return user;
  }

  it("shows the Analytics title", async () => {
    await goToAnalytics();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    });
  });

  it("shows KPI cards", async () => {
    await goToAnalytics();
    await waitFor(() => {
      expect(screen.getByText("MRR estimé")).toBeInTheDocument();
      expect(screen.getByText("Taux conversion")).toBeInTheDocument();
    });
  });

  it("shows Pipeline section", async () => {
    await goToAnalytics();
    await waitFor(() => {
      expect(screen.getAllByText("Pipeline").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows Distribution des grades section", async () => {
    await goToAnalytics();
    await waitFor(() => {
      expect(screen.getByText("Distribution des grades")).toBeInTheDocument();
    });
  });
});

describe("Monitor tab", () => {
  async function goToMonitor() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Moniteur"));
    return user;
  }

  it("shows the Moniteur title", async () => {
    await goToMonitor();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Moniteur" })).toBeInTheDocument();
    });
  });

  it("shows environment cards", async () => {
    await goToMonitor();
    await waitFor(() => {
      expect(screen.getByText("Localhost (dev)")).toBeInTheDocument();
      expect(screen.getByText("audit.mathieu-fournier.net")).toBeInTheDocument();
    });
  });

  it("shows refresh all button", async () => {
    await goToMonitor();
    await waitFor(() => {
      expect(screen.getByText("Rafraichir tout")).toBeInTheDocument();
    });
  });
});

describe("Email tab", () => {
  async function goToEmail() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Email"));
    return user;
  }

  it("shows filter toggle buttons", async () => {
    await goToEmail();
    await waitFor(() => {
      expect(screen.getByText("Tous")).toBeInTheDocument();
      expect(screen.getByText("Reçus")).toBeInTheDocument();
      expect(screen.getByText("Envoyés")).toBeInTheDocument();
    });
  });

  it("shows new message button", async () => {
    await goToEmail();
    await waitFor(() => {
      expect(screen.getByText("+ Nouveau message")).toBeInTheDocument();
    });
  });
});

describe("Scanner modes", () => {
  async function goToScanner() {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByText("Scanner"));
    return user;
  }

  it("shows Pages Jaunes mode button", async () => {
    await goToScanner();
    await waitFor(() => {
      expect(screen.getByText("Pages Jaunes")).toBeInTheDocument();
    });
  });

  it("shows Google Maps mode button", async () => {
    await goToScanner();
    await waitFor(() => {
      expect(screen.getByText("Google Maps")).toBeInTheDocument();
    });
  });

  it("shows Audit site web mode button", async () => {
    await goToScanner();
    await waitFor(() => {
      expect(screen.getByText("Audit site web")).toBeInTheDocument();
    });
  });

  it("shows Registre QC mode button", async () => {
    await goToScanner();
    await waitFor(() => {
      expect(screen.getByText("Registre QC")).toBeInTheDocument();
    });
  });
});
