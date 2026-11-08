import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LuCheck, LuCopy, LuMoveHorizontal } from 'react-icons/lu';
import { Modal as AppModal } from '@/components/ui/Modal';

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2, minimumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Moscow' });
export function formatMoney(value: number) { return money.format(value); }
export function Money({ value }: { value: number }) { return <span className="p-money">{formatMoney(value)}</span>; }
export function formatDate(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : date.format(parsed); }
export function formatPayoutId(value: string) {
  return `№ ${value.slice(-10).toUpperCase()}`;
}

const statuses: Record<string, [string, string]> = {
  approved: ['Одобрено', 'positive'], rejected: ['Отклонено', 'negative'],
  new: ['Новая', 'info'], review: ['На проверке', 'warning'], paid: ['Выплачено', 'positive'],
  trial: ['Пробный период', 'info'], active: ['Подписка активна', 'positive'], overdue: ['Оплата просрочена', 'negative'],
  cancelled: ['Отменён', 'muted'], available: ['Доступно', 'positive'], held: ['Ожидает проверки', 'warning'],
  commission: ['Начисление', 'positive'], refund: ['Возврат', 'negative'], adjustment: ['Корректировка', 'info'],
};
export function StatusBadge({ status }: { status: string }) {
  const [label, tone] = statuses[status] || [status, 'muted'];
  return <span className={`p-status ${tone}`}><span aria-hidden="true" />{label}</span>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  // Capture the trigger before React commits autoFocus inside the dialog.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = content.current?.closest('[role="dialog"]') as HTMLElement | null;
    if (!dialog) return;
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
    if (!dialog.contains(document.activeElement)) {
      (dialog.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), select:not(:disabled)') || focusables()[0])?.focus({ preventScroll: true });
    }
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    dialog.addEventListener('keydown', trap);
    return () => { dialog.removeEventListener('keydown', trap); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [opener]);
  return <AppModal isOpen onClose={onClose} title={title} ariaLabel={title} showLogo={false} maxWidth="max-w-3xl" className="p-modal"><div ref={content} className="p-modal-body">{children}</div></AppModal>;
}

export function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div className="p-table-scroll">{overflowing && <p className="p-table-hint"><LuMoveHorizontal aria-hidden="true" />Прокрутите таблицу, чтобы увидеть все столбцы</p>}<div ref={container} className="p-table-wrap" role="region" aria-label={label} tabIndex={overflowing ? 0 : undefined}>{children}</div></div>;
}

export function CopyButton({ value, label = 'Копировать' }: { value: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setState('copied'); }
    catch { setState('error'); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setState('idle'), 3500);
  }
  return <div className="p-copy"><button type="button" className="p-button small" onClick={copy}>{state === 'copied' ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}{state === 'copied' ? 'Скопировано' : label}</button><span role="status" className={state === 'error' ? 'p-negative' : 'p-sr-only'}>{state === 'error' ? 'Не удалось скопировать. Выделите ссылку и скопируйте вручную.' : state === 'copied' ? 'Ссылка скопирована' : ''}</span></div>;
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <div className="p-empty"><h3>{title}</h3>{description && <p>{description}</p>}{children}</div>;
}
