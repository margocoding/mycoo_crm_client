import type { Meeting, MeetingPerson } from '@/types/meetings.types';

// Demo directory for the frontend prototype. No invitations or API requests are sent.
export const meetingDepartments = [
  { id: 'operations', name: 'Операционный отдел' },
  { id: 'sales', name: 'Отдел продаж' },
  { id: 'product', name: 'Продукт и разработка' },
];
export function meetingPeople(name: string): MeetingPerson[] {
  return [
    { id: 'me', name, position: 'Собственник', departmentId: 'all' },
    {
      id: 'anna',
      name: 'Анна Смирнова',
      position: 'Руководитель',
      departmentId: 'operations',
    },
    {
      id: 'max',
      name: 'Максим Волков',
      position: 'Менеджер проектов',
      departmentId: 'operations',
    },
    {
      id: 'olga',
      name: 'Ольга Соколова',
      position: 'Операционный менеджер',
      departmentId: 'operations',
    },
    {
      id: 'elena',
      name: 'Елена Козлова',
      position: 'Руководитель',
      departmentId: 'sales',
    },
    {
      id: 'dmitry',
      name: 'Дмитрий Морозов',
      position: 'Менеджер по продажам',
      departmentId: 'sales',
    },
    {
      id: 'alex',
      name: 'Алексей Иванов',
      position: 'Руководитель',
      departmentId: 'product',
    },
    {
      id: 'maria',
      name: 'Мария Орлова',
      position: 'Дизайнер',
      departmentId: 'product',
    },
  ];
}
export function seedMeetings(): Meeting[] {
  const date = (days: number, hours: number) => {
    const value = new Date();
    value.setDate(value.getDate() + days);
    value.setHours(hours, 0, 0, 0);
    return value.toISOString();
  };
  return [
    {
      id: 'operations-demo',
      title: 'Синхронизация команды',
      startsAt: date(1, 10),
      duration: 45,
      departmentId: 'operations',
      organizerId: 'me',
      status: 'scheduled',
      participants: [
        { personId: 'me', role: 'host' },
        { personId: 'anna', role: 'cohost' },
        { personId: 'max', role: 'participant' },
        { personId: 'olga', role: 'participant' },
      ],
      agenda:
        'Итоги недели и открытые вопросы\nПриоритеты команды на следующую неделю\nОтветственные и следующие шаги',
      waitingRoom: true,
      muteOnEntry: true,
      allowScreenShare: true,
    },
    {
      id: 'sales-demo',
      title: 'План продаж на октябрь',
      startsAt: date(2, 14),
      duration: 60,
      departmentId: 'sales',
      organizerId: 'me',
      status: 'scheduled',
      participants: [
        { personId: 'me', role: 'host' },
        { personId: 'elena', role: 'cohost' },
        { personId: 'dmitry', role: 'participant' },
      ],
      agenda:
        'Ключевые клиенты и прогноз\nПоддержка команды и распределение нагрузки',
      waitingRoom: false,
      muteOnEntry: true,
      allowScreenShare: true,
    },
    {
      id: 'product-demo',
      title: 'Обсуждение продуктового плана',
      startsAt: date(-1, 11),
      duration: 30,
      departmentId: 'product',
      organizerId: 'me',
      status: 'completed',
      startedAt: date(-1, 11),
      endedAt: date(-1, 12),
      participants: [
        { personId: 'me', role: 'host' },
        { personId: 'alex', role: 'cohost' },
        { personId: 'maria', role: 'participant' },
      ],
      agenda: 'Обсудить сценарий встреч и последовательность запуска',
      notes:
        'Пример заметки: согласовать основные сценарии с командой и собрать обратную связь.',
      waitingRoom: false,
      muteOnEntry: true,
      allowScreenShare: true,
    },
  ];
}
