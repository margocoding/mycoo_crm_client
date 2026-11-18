import { LuCalendarDays } from 'react-icons/lu';
import { payoutFrequencyLabels } from './partner.model';
import { formatDate } from './PartnerUI';
import type { ProgramTerms } from './partner.types';

export function PayoutSchedule({ terms }: { terms: ProgramTerms }) {
  const frequency = payoutFrequencyLabels[terms.payoutFrequency];
  return <div className="p-notice">
    <LuCalendarDays aria-hidden="true" />
    <div>
      <strong>График выплат{frequency ? `: ${frequency.toLowerCase()}` : ''}</strong>
      <p>{terms.nextPayoutDate ? <>Ближайшая дата — <time dateTime={terms.nextPayoutDate}>{formatDate(terms.nextPayoutDate)}</time>, по московскому времени.</> : 'Первую дату выплаты задаёт администратор.'}</p>
      <p>Заявки можно подавать в любое время. Выплаты проводятся по общему графику после одобрения заявки.</p>
    </div>
  </div>;
}
