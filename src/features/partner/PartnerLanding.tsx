import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuCircleCheck, LuCoins, LuHandshake, LuReceiptText, LuUsers, LuWorkflow } from 'react-icons/lu';
import { usePartnerStore } from './partner.store';
import { Money, formatDate } from './PartnerUI';
import { payoutFrequencyLabels } from './partner.model';
import { PartnerPublicFooter, PartnerPublicHeader } from './PartnerLayout';

import { billingApi } from '@/api/billing.api';
import type { BillingCatalog } from '@/types/billing.types';

export default function PartnerLanding() {
  const terms = usePartnerStore(state => state.terms);
  const [selectedPayment, setPayment] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    billingApi.plans(controller.signal).then(value => {
      if (!controller.signal.aborted) setCatalog(value);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [revision]);
  const payment = selectedPayment ?? (catalog?.plans.find(plan => plan.recommended)?.monthKopecks ?? catalog?.plans[0]?.monthKopecks ?? 0) / 100;
  return <div className="p-public">
    <PartnerPublicHeader />
    <main>
      <section className="p-hero">
        <div><span className="p-kicker">Партнёрская программа MyCoo</span><h1>Рекомендуйте MyCoo.<br /><span>Получайте комиссию.</span></h1><p>Приглашайте компании в MyCoo — сервис для задач, командной работы и встреч. Получайте комиссию с оплат их подписки.</p><div className="p-actions"><Link to="/partner/register" className="p-button primary">Стать партнёром <LuArrowRight aria-hidden="true" /></Link><a href="#how-it-works" className="p-button">Как это работает</a></div></div>
        <div className="p-receipt"><div className="p-receipt-top"><div><span className="p-kicker">Пример расчёта</span><h2>Ваше вознаграждение</h2></div><LuReceiptText aria-hidden="true" /></div><label className="p-field"><span>Месячный платёж клиента</span><select disabled={!catalog} value={payment} onChange={event => setPayment(Number(event.target.value))}>{!catalog && <option value={0}>{error ? "Тарифы недоступны" : "Загружаем тарифы…"}</option>}{catalog?.plans.map(plan => <option key={plan.id} value={plan.monthKopecks / 100}>{(plan.monthKopecks / 100).toLocaleString("ru-RU")} ₽ · {plan.name}</option>)}</select>{error && <span role="alert">Не удалось загрузить цены. <button type="button" onClick={() => setRevision(n => n + 1)}>Повторить</button></span>}</label><div className="p-receipt-equation"><span>Комиссия партнёра</span><strong>{terms.commissionPercent}%</strong></div><div className="p-receipt-result"><span className="p-kicker">С одного платежа</span><strong>{catalog ? <Money value={Math.round(payment * terms.commissionPercent) / 100} /> : "—"}</strong><p className="p-muted">Комиссия начисляется в первые {terms.eligibleMonths} мес. после регистрации клиента.</p></div><ol className="p-receipt-path"><li><LuCircleCheck aria-hidden="true" />Клиент оплатил</li><li><LuReceiptText aria-hidden="true" />Комиссия начислена</li><li><LuCoins aria-hidden="true" />Заявка на выплату</li></ol></div>
      </section>
      <section id="how-it-works" className="p-public-section"><div className="p-section-head"><h2>Как стать партнёром</h2><p className="p-muted">Клиенты, начисления и выплаты — в личном кабинете.</p></div><div className="p-steps"><article className="p-step"><span>01 / РЕГИСТРАЦИЯ</span><h3>Зарегистрируйтесь</h3><p>Войдите в аккаунт MyCoo или создайте новый, затем заполните профиль. Компания для участия не нужна.</p></article><article className="p-step"><span>02 / РЕКОМЕНДАЦИЯ</span><h3>Поделитесь ссылкой</h3><p>Клиент регистрируется по вашей ссылке. Когда он оплатит подписку, вы увидите начисление в кабинете.</p></article><article className="p-step"><span>03 / ВЫПЛАТА</span><h3>Запросите выплату</h3><p>Накопите минимальную сумму, укажите реквизиты и отправьте заявку на выплату.</p></article></div></section>
      <section className="p-public-section p-program"><div><span className="p-kicker">Кому подойдёт</span><h2 style={{ marginTop: 12 }}>Тем, кто работает<br />с бизнесом</h2><ul className="p-audience"><li><LuHandshake aria-hidden="true" />Бизнес-консультантам и наставникам</li><li><LuWorkflow aria-hidden="true" />Интеграторам и специалистам по автоматизации</li><li><LuUsers aria-hidden="true" />Агентствам и предпринимательским сообществам</li></ul></div><div className="p-panel"><div className="p-panel-head"><div><span className="p-kicker">Предварительные условия</span><h2>Комиссия и выплаты</h2></div></div><ul className="p-rule-list"><li><LuCheck aria-hidden="true" /><span><strong>{terms.commissionPercent}% от оплат</strong> клиента в первые {terms.eligibleMonths} мес. после регистрации.</span></li><li><LuCheck aria-hidden="true" /><span>Комиссия доступна для заявки на выплату после подтверждения оплаты клиента.</span></li><li><LuCheck aria-hidden="true" /><span>Выплаты — {payoutFrequencyLabels[terms.payoutFrequency]?.toLowerCase() ?? "по общему графику"}. {terms.nextPayoutDate ? <>Ближайшая дата — {formatDate(terms.nextPayoutDate)}.</> : "Первую дату задаёт администратор."} Заявки можно подавать в любое время.</span></li><li><LuCheck aria-hidden="true" /><span>Минимальная сумма выплаты — <strong><Money value={terms.minimumPayout} /></strong>.</span></li><li><LuCheck aria-hidden="true" /><span>За каждую оплату комиссия начисляется один раз. Возвраты уменьшают её сумму.</span></li></ul></div></section>
      <section className="p-public-section p-faq"><div className="p-section-head"><h2>Частые вопросы</h2><Link to="/partner/register" className="p-button primary">Стать партнёром <LuArrowRight aria-hidden="true" /></Link></div><details><summary>Чем партнёрская программа отличается от приглашения друзей?</summary><p>Партнёры получают комиссию с оплат приглашённых компаний. Программа приглашений со скидками на подписку работает отдельно.</p></details><details><summary>Какие сведения о клиентах будут видны?</summary><p>Название компании, дата регистрации, статус подписки и оплаты, с которых начислена комиссия. Контакты сотрудников не раскрываются.</p></details><details><summary>Почему часть начислений пока недоступна?</summary><p>Суммы в отправленных заявках зарезервированы до завершения выплаты или отклонения заявки. Для ранее начисленных комиссий сохраняются даты доступности, указанные в истории.</p></details></section>
    </main><PartnerPublicFooter />
  </div>;
}
