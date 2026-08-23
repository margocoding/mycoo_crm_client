import { useState } from "react";
import { IconX, IconCheck } from "./icons";
import { StatusChip } from "./ambient";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const PLANS = [
  {
    id: "monthly",
    name: "Ежемесячный",
    desc: "Гибкая оплата по месяцам",
    price: 4900,
    period: "мес",
    features: [
      "Все возможности MyCOO",
      "AI-анализ информации компании",
      "Управленческие рекомендации",
      "До 25 пользователей",
      "Приоритетная поддержка",
    ],
    discount: null,
  },
  {
    id: "yearly",
    name: "Годовой",
    desc: "Выгода 20% при оплате за год",
    price: 47040, // 4900 * 12 * 0.8 = 47040
    originalPrice: 58800, // 4900 * 12 = 58800
    period: "год",
    features: [
      "Все возможности MyCOO",
      "AI-анализ информации компании",
      "Управленческие рекомендации",
      "До 25 пользователей",
      "Приоритетная поддержка",
      "Экономия 20%",
    ],
    discount: "-20%",
  },
];

export function SubscriptionModal({ open, onClose, onComplete }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"robokassa" | "invoice" | null>(null);

  if (!open) return null;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setPaymentMethod(null);
  };

  const handlePaymentMethodSelect = (method: "robokassa" | "invoice") => {
    setPaymentMethod(method);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-void/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Выбор тарифа"
    >
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="corner glass step-in relative w-full max-w-5xl rounded-xl shadow-[0_0_90px_-20px_rgba(56,189,248,0.35)]">
          <span className="cx pointer-events-none absolute inset-0" />

          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 md:px-7">
            <div>
              <p className="font-display text-[13px] font-bold tracking-[0.18em] text-snow">
                MYCOO <span className="text-fog/60">/</span>{" "}
                <span className="text-flux">ВЫБОР ТАРИФА</span>
              </p>
              <p className="mono-label text-fog/50">
                Выберите план подключения
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-fog transition-all duration-300 hover:border-crit/60 hover:text-crit"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 md:p-8">
            {!selectedPlan ? (
              /* Выбор тарифа */
              <div className="grid gap-5 md:grid-cols-2">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`corner relative flex flex-col rounded-xl p-6 text-left transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? "border-flux/50 bg-flux/5 shadow-[0_0_40px_-10px_rgba(56,189,248,0.4)]"
                        : "glass border-line/50 hover:border-flux/30"
                    }`}
                  >
                    {plan.discount && (
                      <div className="absolute -top-3 left-6">
                        <span className="rounded-full border border-ion/50 bg-ion/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ion">
                          {plan.discount}
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h3 className="font-display text-xl font-bold text-snow">{plan.name}</h3>
                      <p className="mt-1 text-[13px] text-fog">{plan.desc}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        {plan.originalPrice && (
                          <span className="font-mono text-[13px] text-fog/50 line-through">
                            {plan.originalPrice.toLocaleString("ru-RU")} ₽
                          </span>
                        )}
                        <span className="font-display text-3xl font-bold text-snow">
                          {plan.price.toLocaleString("ru-RU")} ₽
                        </span>
                        <span className="font-mono text-[12px] text-fog">/ {plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-mist">
                          <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <span className="btn-primary inline-block w-full rounded-md bg-flux/10 px-4 py-3 text-center text-[13px] font-bold text-flux transition-all duration-300 hover:bg-flux/20">
                        Выбрать этот план
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Выбор способа оплаты */
              <div className="max-w-2xl">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="mb-6 flex items-center gap-2 text-[13px] text-fog/70 transition-colors hover:text-flux"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 13L5 8l5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Вернуться к выбору тарифа
                </button>

                <div className="mb-8 rounded-lg border border-line/50 bg-hull/30 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg font-bold text-snow">
                        {selectedPlanData?.name}
                      </p>
                      <p className="mono-label mt-1 text-fog/60">
                        {selectedPlanData?.price.toLocaleString("ru-RU")} ₽ / {selectedPlanData?.period}
                      </p>
                    </div>
                    <StatusChip tone="flux">выбрано</StatusChip>
                  </div>
                </div>

                <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-fog/60">
                  Способ оплаты
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Robokassa */}
                  <button
                    onClick={() => handlePaymentMethodSelect("robokassa")}
                    className={`corner flex flex-col items-center justify-center rounded-xl p-6 text-center transition-all duration-300 ${
                      paymentMethod === "robokassa"
                        ? "border-flux/50 bg-flux/5 shadow-[0_0_30px_-8px_rgba(56,189,248,0.3)]"
                        : "glass border-line/50 hover:border-flux/30"
                    }`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-flux/10">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 text-flux" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 10h18M3 14h18" strokeLinecap="round" />
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                      </svg>
                    </div>
                    <p className="font-display text-[14px] font-bold text-snow">Robokassa</p>
                    <p className="mt-1 text-[12px] text-fog">Банковская карта, SBERPAY, СБП</p>
                  </button>

                  {/* Invoice */}
                  <button
                    onClick={() => handlePaymentMethodSelect("invoice")}
                    className={`corner flex flex-col items-center justify-center rounded-xl p-6 text-center transition-all duration-300 ${
                      paymentMethod === "invoice"
                        ? "border-flux/50 bg-flux/5 shadow-[0_0_30px_-8px_rgba(56,189,248,0.3)]"
                        : "glass border-line/50 hover:border-flux/30"
                    }`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ion/10">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 text-ion" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="font-display text-[14px] font-bold text-snow">Счёт для ООО</p>
                    <p className="mt-1 text-[12px] text-fog">Оплата с расчётного счёта</p>
                  </button>
                </div>

                {paymentMethod && (
                  <div className="mt-8 acc-body open">
                    <div className="rounded-lg border border-line/50 bg-hull/30 p-5">
                      <p className="text-[13px] leading-relaxed text-fog">
                        {paymentMethod === "robokassa" ? (
                          <>
                            Вы будете перенаправлены на платёжную страницу Robokassa для безопасной оплаты. 
                            После подтверждения платежа ваш тариф будет активирован мгновенно.
                          </>
                        ) : (
                          <>
                            Мы выставим счёт для оплаты с расчётного счёта вашей компании. 
                            Документ будет отправлен на вашу электронную почту в течение 15 минут.
                            Срок оплаты счёта — 3 банковских дня.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-md border border-line px-5 py-3.5 text-center text-[13px] font-medium text-fog transition-colors hover:text-snow"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!paymentMethod}
                    className={`flex-1 rounded-md px-5 py-3.5 text-center text-[13px] font-bold transition-all duration-300 ${
                      paymentMethod
                        ? "bg-flux text-void shadow-[0_0_24px_-6px_rgba(56,189,248,0.55)] hover:bg-ice"
                        : "bg-hull/50 text-fog/50 cursor-not-allowed"
                    }`}
                  >
                    {paymentMethod === "robokassa" ? "Перейти к оплате" : "Запросить счёт"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
