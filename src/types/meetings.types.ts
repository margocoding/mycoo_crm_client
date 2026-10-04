export type MeetingRole = 'host' | 'cohost' | 'participant';
export type MeetingStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export interface MeetingPerson {
  id: string;
  name: string;
  position: string;
  departmentId: string;
}
export interface MeetingParticipant {
  personId: string;
  role: MeetingRole;
}
export interface Meeting {
  id: string;
  title: string;
  startsAt: string;
  duration: number;
  departmentId: string;
  organizerId: string;
  participants: MeetingParticipant[];
  agenda: string;
  status: MeetingStatus;
  waitingRoom: boolean;
  muteOnEntry: boolean;
  allowScreenShare: boolean;
  startedAt?: string;
  endedAt?: string;
  notes?: string;
  departmentName?: string;
  kind?: string;
  objective?: string;
  previousId?: string | null;
}
export type MeetingDraft = Pick<
  Meeting,
  | 'title'
  | 'startsAt'
  | 'duration'
  | 'departmentId'
  | 'participants'
  | 'agenda'
  | 'waitingRoom'
  | 'muteOnEntry'
  | 'allowScreenShare'
>;
export const MEETING_KINDS = [
  ['operations','Операционное совещание'], ['standup','Планёрка'], ['one-on-one','1:1'], ['strategy','Стратегическая встреча'],
  ['problem','Разбор проблемы'], ['decision','Принятие решения'], ['project','Проектная встреча'], ['department','Встреча отдела'],
  ['leaders','Встреча руководителей'], ['other','Другое'],
] as const;
export const MEETING_TEMPLATES: Record<string,string> = {
  operations: '1. Что планировали и что выполнено?\n2. Что не выполнено и почему?\n3. Какие решения нужны?\n4. Кто отвечает и что сделает к следующей встрече?',
  standup: '1. Результаты с прошлой встречи\n2. План до следующей встречи\n3. Препятствия и необходимая помощь',
  'one-on-one': '1. Результаты и сложности\n2. Обратная связь\n3. Поддержка и следующие шаги',
  strategy: '1. Цель и горизонт планирования\n2. Варианты и ограничения\n3. Приоритеты\n4. Ответственные и контрольные точки',
  problem: '1. Факты и влияние проблемы\n2. Возможные причины\n3. Варианты решения\n4. Решение, срок и критерий результата',
  decision: '1. Какое решение требуется?\n2. Варианты и аргументы\n3. Выбор\n4. Ответственный, срок и проверка результата',
  project: '1. Прогресс и контрольные точки\n2. Риски и блокеры\n3. Следующие задачи и сроки',
  department: '1. Результаты отдела\n2. Открытые задачи\n3. Нагрузка и помощь\n4. Решения и поручения',
  leaders: '1. Результаты подразделений\n2. Межотдельские зависимости\n3. Вопросы собственнику\n4. Договорённости', other: '',
};
export interface ProtocolTask { title: string; assigneeIds: string[]; startDate: string|null; dueDate: string|null; successCriteria: string; priority: 'low'|'medium'|'high'; }
export interface MeetingAnalysis { summary: string; ownerSummary: string; decisions: string[]; risks: string[]; openQuestions: string[]; tasks: ProtocolTask[]; }
export interface LiveMeeting extends Meeting {
  locked: boolean; canHost: boolean; canModerate: boolean; canReview: boolean; myRole: MeetingRole; callsAvailable: boolean;
  participants: (MeetingParticipant & { name: string; admitted: boolean; removed: boolean; raisedHand: boolean; requestedAt?: string|null })[];
  people: { id: string; name: string }[];
  recordings: { id: string; status: string; error: string|null; createdAt: string; downloadable: boolean }[];
  transcript: string|null; analysis: MeetingAnalysis|null; analysisStatus: string; analysisRevision: number; analysisError: string|null; publishedAt: string|null;
  tasks: { id: string; title: string; status: string; dueDate: string }[];
}
export const MEETING_ROLES: Record<MeetingRole, string> = {
  host: 'Организатор',
  cohost: 'Соорганизатор',
  participant: 'Участник',
};
export const MEETING_STATUSES: Record<MeetingStatus, string> = {
  scheduled: 'Запланирована',
  live: 'Идёт встреча',
  completed: 'Завершена',
  cancelled: 'Отменена',
};
