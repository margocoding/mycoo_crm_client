import { useState } from "react";
import { Reveal, Decode } from "../lib/motion";
import { OrbitRings, StatusChip, StatusDot } from "./ambient";
import { Logo, IconArrow } from "./icons";
import { useLaunch } from "./Register";

/* ============ ФИНАЛЬНЫЙ CTA ============ */

export function Launch() {
  const { open: openLaunch } = useLaunch();

  return (
    <section id="launch" className="relative overflow-hidden border-t border-line/50 py-28 md:py-36">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute -left-56 top-1/2 -z-10 -translate-y-1/2 opacity-60">
        <OrbitRings size={620} />
      </div>
      <div
        className="horizon -z-10"
        style={{
          bottom: "-70vw",
          width: "160vw",
          height: "76vw",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(56,90,180,0.3) 0%, rgba(10,18,42,0.9) 36%, #05080f 62%)",
          boxShadow:
            "0 -1px 0 rgba(125,211,252,0.35), 0 -20px 70px -14px rgba(56,189,248,0.3), 0 -70px 160px -40px rgba(139,133,248,0.22)",
        }}
      />

      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <Reveal>
          <div className="mb-8 flex items-center justify-center gap-3">
            <StatusChip tone="ok">mycoo / ready to launch</StatusChip>
          </div>
          <h2 className="font-display text-[clamp(1.7rem,4.6vw,3.1rem)] font-bold leading-[1.1] tracking-tight text-snow">
            <Decode text="Передайте операционку" className="block" />
            <Decode text="цифровому директору" delay={450} className="block text-flux text-glow" />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-fog md:text-base">
            MyCOO помогает превращать информацию компании в решения, действия и
            контролируемый результат.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="glass corner relative mx-auto mt-10 max-w-xl rounded-xl p-6 md:p-7">
            <span className="cx pointer-events-none absolute inset-0" />
            <div className="mb-5 flex items-center justify-between">
              <span className="mono-label text-fog">протокол запуска</span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ok/90">
                <StatusDot /> crew onboarding
              </span>
            </div>

            {/* launch steps */}
            <ol className="mb-6 space-y-2 text-left font-mono text-[11.5px] text-fog/85">
              <li className="flex items-center gap-3">
                <span className="text-flux">▸</span> шаг 01 · регистрация по email
              </li>
              <li className="flex items-center gap-3">
                <span className="text-flux">▸</span> шаг 02 · пароль и подтверждение кодом
              </li>
              <li className="flex items-center gap-3">
                <span className="text-flux">▸</span> шаг 03 · бриф компании · ~5 минут
              </li>
              <li className="flex items-center gap-3">
                <span className="text-ion">▸</span> шаг 04 · экспресс-диагностика → управленческий профиль
              </li>
              <li className="flex items-center gap-3">
                <span className="text-ok">▸</span> шаг 05 · trial · 10 дней в рабочем пространстве
              </li>
            </ol>

            <button
              type="button"
              onClick={openLaunch}
              className="btn-primary group inline-flex w-full items-center justify-center gap-3 rounded-md bg-flux px-6 py-4 text-[14px] font-bold text-void shadow-[0_0_36px_-8px_rgba(56,189,248,0.7)] transition-all duration-300 hover:bg-ice hover:shadow-[0_0_52px_-8px_rgba(56,189,248,0.95)]"
            >
              Запустить своего цифрового операционного директора
              <IconArrow className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <p className="mono-label mt-4 text-fog/45">
              trial стартует после онбординга · демо-режим без передачи данных
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */

const FOOT_NAV = [
  { href: "#about", label: "О системе" },
  { href: "#how", label: "Как работает" },
  { href: "#features", label: "Возможности" },
  { href: "#control", label: "Mission Control" },
];
const FOOT_NAV2 = [
  { href: "#cases", label: "Кейсы" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "FAQ" },
  { href: "#launch", label: "Запуск" },
];

export function Footer() {
  const [legalNote, setLegalNote] = useState("");

  const legal = (doc: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setLegalNote(`«${doc}» будет опубликован на этапе запуска продукта.`);
  };

  return (
    <footer className="relative border-t border-line/60 bg-void/80">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* brand */}
          <div>
            <a href="#top" className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <span className="font-display text-[16px] font-bold tracking-[0.22em] text-snow">MYCOO</span>
            </a>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-fog">
              Цифровой операционный директор. Превращаем информацию компании в
              управленческие решения, задачи, контроль и договорённости.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded border border-line bg-hull/50 px-3 py-1.5">
              <StatusDot />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ok">
                ai coo / online · v1.0
              </span>
            </div>
          </div>

          {/* nav */}
          <div>
            <h4 className="mono-label mb-4 text-fog/70">Навигация</h4>
            <ul className="space-y-2.5">
              {FOOT_NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-[13.5px] text-fog transition-colors hover:text-flux">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mono-label mb-4 text-fog/70">Разделы</h4>
            <ul className="space-y-2.5">
              {FOOT_NAV2.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-[13.5px] text-fog transition-colors hover:text-flux">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* contacts */}
          <div>
            <h4 className="mono-label mb-4 text-fog/70">Контакты</h4>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <a href="mailto:hello@mycoo.ai" className="font-mono text-[13px] text-mist transition-colors hover:text-flux">
                  hello@mycoo.ai
                </a>
              </li>
              <li className="text-fog">Запуск и внедрение — вместе с командой MyCOO</li>
            </ul>
            <div className="mt-6 space-y-2">
              <div className="flex gap-5">
                <a href="#" onClick={legal("Политика конфиденциальности")} className="text-[12.5px] text-fog underline decoration-line underline-offset-4 transition-colors hover:text-flux">
                  Политика конфиденциальности
                </a>
              </div>
              <a href="#" onClick={legal("Пользовательское соглашение")} className="text-[12.5px] text-fog underline decoration-line underline-offset-4 transition-colors hover:text-flux">
                Пользовательское соглашение
              </a>
              {legalNote && (
                <p className="mt-3 flex items-start gap-2 rounded-md border border-warn/25 bg-warn/5 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-warn/90">
                  <StatusDot color="var(--color-warn)" />
                  {legalNote}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line/50 pt-7 md:flex-row">
          <p className="font-mono text-[11px] text-fog/60">
            © {new Date().getFullYear()} MyCOO · Цифровой операционный директор
          </p>
          <p className="mono-label text-fog/40">
            компания = корабль · mycoo = mission control
          </p>
        </div>
      </div>
    </footer>
  );
}
