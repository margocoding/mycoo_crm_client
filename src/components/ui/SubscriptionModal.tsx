import { Modal } from './Modal';
import SubscriptionContent from '@/components/shared/billing/SubscriptionContent';

export default function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Подписка MyCOO" title="Подписка MyCOO"
    subtitle="Тарифы и реферальная программа" statusChip={{ tone: 'flux', text: 'billing' }} maxWidth="max-w-3xl">
    {isOpen && <SubscriptionContent />}
  </Modal>;
}
