export interface AiCooDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface AiCooMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  documents?: Array<{ id: string; name: string }>;
  status?: "pending" | "failed" | "complete";
  requestId?: string;
}

export interface AiCooState {
  conversation: { id: string };
  scope: { departmentId: string | null; name: string; personal: boolean };
  scopes: Array<{ id: string; name: string }>;
  context: {
    company: {
      name: string | null;
      industry: string | null;
      goal: string | null;
      priorities: string[];
    };
    periodStart: string;
    periodEnd: string;
    tasks: {
      total: number;
      included: number;
      active: number;
      completed: number;
      overdue: number;
    };
    dashboard: {
      status: "restricted" | "unavailable" | "stale" | "ready";
      generatedAt: string | null;
      analysis: {
        goalProgress: number | null;
        goalExplanation: string;
        risks: Array<{ tone: "crit" | "warn"; text: string }>;
        recommendation: string;
      } | null;
    };
  };
  documents: AiCooDocument[];
  messages: AiCooMessage[];
}
