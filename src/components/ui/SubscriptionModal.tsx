import { useState } from "react";
import { LuX, LuCheck, LuCreditCard, LuFileText } from "react-icons/lu";
import { Reveal } from "../../lib/motion";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Тарифы из лендинга (цены нужно уточнить, ставим ориентировочные)
const PRICES = {
  START_MONTH: 9900,
  START_YEAR: 95040, // 9900 * 12 * 0.8 = 95040 (скидка 20%)
  MISSION_MONTH: 24900,
  MISSION_YEAR: 239040, // 24900 * 12 * 0.8 = 239040 (скидка 20%)
  ENTERPRISE_MONTH: 49900,
  ENTERPRISE_YEAR: 479040, // 49900 * 12 * 0.8 = 479040 (скидка 20%)
};

const PLANS = [
  {
    id: "START",
    name: "Пуск",
    desc: "Базовый операционный контур",
    features: ["До 5 пользователей", "Управление задачами", "Базовая аналитика"],
  },
  {
    id: "MISSION",
    name: "Миссия",
    desc: "Полный цикл с AI-анализом",
    features: ["До 25 пользователей", "AI-рекомендации", "Приоритетная поддержка"],
    recommended: true,
  },
  {
    id: "ENTERPRISE",
    name: "Флот",
    desc: "Несколько контуров",
    features: ["Безлимитные пользователи", "Индивидуальная конфигурация", "Сопровождение команды"],
  },
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string>("MISSION");
  const [paymentMethod, setPaymentMethod] = useState<"robokassa" | "invoice" | null>(null);

  if (!isOpen) return null;

  const getPrice = (planId: string) => {
    const key = `${planId}_${billingPeriod.toUpperCase()}` as keyof typeof PRICES;
    return PRICES[key];
  };

  const handleRobokassaPayment = () => {
    // Здесь будет интеграция с Robokassa
    alert(`Переход на оплату через Robokassa:\nТариф: ${selectedPlan}\nПериод: ${billingPeriod === "month" ? "месяц" : "год"}\nСумма: ${getPrice(selectedPlan).toLocaleString()} ₽`);
    onClose();
  };

  const handleInvoiceRequest = () => {
    // Здесь будет логика запроса счета
    alert(`Запрос счета для юридического лица:\nТариф: ${selectedPlan}\nПериод: ${billingPeriod === "month" ? "месяц" : "год"}\nСумма: ${getPrice(selectedPlan).toLocaleString()} ₽\n\nСчет будет отправлен на вашу почту.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Reveal delay={0}>
        <div className="relative w-full max-w-2xl glass corner rounded-xl border border-line/50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line/40 px-6 py-4">
            <div>
              <h2 className="font-display text-[16px] font-bold tracking-[0.18em] text-snow">
                Выбор тарифа
              </h2>
              <p className="mono-label text-[9px] text-fog/60">
                Подписка MyCOO
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-fog/60 transition-colors hover:text-snow"
            >
              <LuX className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Переключатель периода */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className={`text-[12px] font-medium ${billingPeriod === "month" ? "text-snow" : "text-fog/60"}`}>
                Ежемесячно
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "month" ? "year" : "month")}
                className={`relative h-6 w-12 rounded-full transition-colors ${
                  billingPeriod === "year" ? "bg-flux/60" : "bg-hull/40"
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-snow transition-transform ${
                    billingPeriod === "year" ? "left-7" : "left-1"
                  }`}
                />
              </button>
              <span className={`text-[12px] font-medium ${billingPeriod === "year" ? "text-snow" : "text-fog/60"}`}>
                Ежегодно
                <span className="ml-1.5 rounded bg-flux/20 px-1.5 py-0.5 text-[9px] font-bold text-flux">
                  -20%
                </span>
              </span>
            </div>

            {/* Карточки тарифов */}
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const price = getPrice(plan.id);
                
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-flux/50 bg-flux/10 shadow-[0_0_20px_-4px_rgba(56,189,248,0.4)]"
                        : "border-line/50 bg-hull/20 hover:border-flux/30"
                    }`}
                  >
                    {plan.recommended && billingPeriod === "month" && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="rounded-full border border-flux/50 bg-void px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-flux">
                          Популярный
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <span className="font-mono text-[9px] font-bold text-fog/50">
                        {plan.id}
                      </span>
                    </div>
                    
                    <h3 className="font-display text-[14px] font-bold text-snow">
                      {plan.name}
                    </h3>
                    
                    <p className="mt-1 text-[10px] text-fog/70">
                      {plan.desc}
                    </p>
                    
                    <div className="mt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-xl font-bold text-flux">
                          {price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-fog/60">
                          ₽ / {billingPeriod === "month" ? "мес" : "год"}
                        </span>
                      </div>
                      {billingPeriod === "year" && (
                        <p className="mt-1 text-[9px] text-ok/70">
                          Экономия {(price * 0.25).toLocaleString()} ₽
                        </p>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-flux">
                        <LuCheck className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Детали выбранного тарифа */}
            <div className="mb-6 rounded-lg border border-line/40 bg-hull/20 p-4">
              <h4 className="mb-2 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-mist">
                Включено в тариф "{PLANS.find(p => p.id === selectedPlan)?.name}"
              </h4>
              <ul className="space-y-1.5">
                {PLANS.find(p => p.id === selectedPlan)?.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-fog/80">
                    <LuCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Метод оплаты */}
            <div className="space-y-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-fog/60">
                Способ оплаты
              </p>
              
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setPaymentMethod("robokassa")}
                  className={`flex items-center justify-center gap-3 rounded-lg border p-4 transition-all ${
                    paymentMethod === "robokassa"
                      ? "border-flux/50 bg-flux/10 text-snow"
                      : "border-line/50 bg-hull/20 text-fog/70 hover:border-flux/30"
                  }`}
                >
                  <LuCreditCard className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-[12px] font-medium">Robokassa</p>
                    <p className="text-[9px] text-fog/50">Банковская карта, SBERPAY, SBP</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod("invoice")}
                  className={`flex items-center justify-center gap-3 rounded-lg border p-4 transition-all ${
                    paymentMethod === "invoice"
                      ? "border-flux/50 bg-flux/10 text-snow"
                      : "border-line/50 bg-hull/20 text-fog/70 hover:border-flux/30"
                  }`}
                >
                  <LuFileText className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-[12px] font-medium">Выставить счет</p>
                    <p className="text-[9px] text-fog/50">Для юрлиц (с НДС)</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-line/40 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-[12px] font-medium text-fog/70 transition-colors hover:text-snow"
            >
              Отмена
            </button>
            <button
              onClick={paymentMethod === "robokassa" ? handleRobokassaPayment : paymentMethod === "invoice" ? handleInvoiceRequest : undefined}
              disabled={!paymentMethod}
              className={`rounded-lg px-5 py-2.5 text-[12px] font-bold transition-all ${
                paymentMethod
                  ? "bg-flux text-void shadow-[0_0_20px_-6px_rgba(56,189,248,0.6)] hover:bg-ice"
                  : "bg-hull/30 text-fog/40 cursor-not-allowed"
              }`}
            >
              {paymentMethod === "robokassa" ? "Оплатить" : paymentMethod === "invoice" ? "Запросить счет" : "Выберите способ оплаты"}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
