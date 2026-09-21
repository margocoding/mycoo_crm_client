export interface Dashboard {
  scope: { departmentId: string | null; name: string; personal: boolean };
  scopes: Array<{ id: string; name: string }>;
  tasks: { active: number; overdue: number; completed: number; items: Array<{
    id: string; title: string; status: string; startDate: string; dueDate: string; departmentId: string | null;
  }> };
  team: { employees: number; managers: number };
  ai: {
    status: 'restricted' | 'updating' | 'unavailable' | 'stale' | 'ready';
    analysis: { goalProgress: number | null; goalExplanation: string;
      risks: Array<{ tone: 'crit' | 'warn'; text: string }>; recommendation: string } | null;
    generatedAt: string | null; periodStart: string | null; periodEnd: string | null; nextRefreshAt: string | null;
  };
  updatedAt: string;
  today: string;
}
