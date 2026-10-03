import { useEffect, useRef, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MEETING_STATUSES, type MeetingStatus } from '@/types/meetings.types';

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}
export function Avatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={'meeting-avatar ' + (large ? 'meeting-avatar-large' : '')}
    >
      {initials(name)}
    </span>
  );
}
export function MeetingBadge({ status }: { status: MeetingStatus }) {
  return (
    <span className={'meeting-badge meeting-status-' + status}>
      <span />
      {MEETING_STATUSES[status]}
    </span>
  );
}
export function formatMeetingDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}
export function formatMeetingTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
export function MeetingDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = content.current?.closest('[role="dialog"]');
    const selector =
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
    (content.current?.querySelector(selector) as HTMLElement | null)?.focus();
    const trap = (event: Event) => {
      const key = event as KeyboardEvent;
      if (key.key !== 'Tab') return;
      const elements = Array.from(
        dialog?.querySelectorAll<HTMLElement>(selector) || [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (key.shiftKey && document.activeElement === first) {
        key.preventDefault();
        last?.focus();
      } else if (!key.shiftKey && document.activeElement === last) {
        key.preventDefault();
        first?.focus();
      }
    };
    dialog?.addEventListener('keydown', trap);
    return () => {
      dialog?.removeEventListener('keydown', trap);
      previous?.focus();
    };
  }, []);
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      ariaLabel={title}
      showLogo={false}
      maxWidth="max-w-2xl"
      className="meetings-ui"
    >
      <div ref={content}>{children}</div>
    </Modal>
  );
}
