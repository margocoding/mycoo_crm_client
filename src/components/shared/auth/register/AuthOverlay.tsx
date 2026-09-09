import { Modal } from "../../../ui/Modal";
import { StatusDot } from "../../../ui/Ambient";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { SiVk, SiYandexcloud } from "react-icons/si";
import { useAuthFlow } from "./hooks/auth.hook";
import { AUTH_PHASES } from "@/lib/constants/constants";
import { useAuthStore } from "@/store/auth.store";
import { useModalRouter } from "@/hooks/useModalRouter";

const SOCIALS = [
  {
    name: "Яндекс ID",
    mark: (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FC3F1D] text-white">
        <SiYandexcloud className="h-3.5 w-3.5" />
      </span>
    ),
  },
  {
    name: "VK ID",
    mark: (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0077FF] text-white">
        <SiVk className="h-3.5 w-3.5" />
      </span>
    ),
  },
];

export function AuthOverlay() {
  const { state, closeModal, updateAuthStep, openModal } = useModalRouter();
  const user = useAuthStore((s) => s.user);

  const open = state.modal === "auth";
  const flow = useAuthFlow(open, closeModal, state, updateAuthStep);

  if (!open) return null;

  const progress = Math.min(flow.step * 25, 100);

  const startOnboarding = () => {
    closeModal();
    openModal("onboarding");
  };

  return (
    <Modal
      isOpen={open}
      onClose={closeModal}
      ariaLabel="Авторизация MyCOO"
      title={
        <>
          MYCOO <span className="text-fog/60">/</span>{" "}
          <span className="text-flux">ACCESS CONTROL</span>
        </>
      }
      subtitle={
        <>
          ses {flow.requestId} · {flow.mode ?? "scan"} · mission start {progress}%
        </>
      }
      statusChip={{
        tone: flow.step === 4 ? "ok" : "flux",
        text:
          flow.step === 4
            ? "onboard"
            : flow.mode === "login"
              ? "login"
              : flow.mode === "register"
                ? "signup"
                : "secure channel",
      }}
      showProgress
      progress={progress}
    >
      <div className="grid md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-line/60 p-6 md:block">
          <p className="mono-label mb-5 text-fog/60">фазы доступа</p>

          <ol className="relative space-y-6">
            <span className="absolute bottom-2 left-[11px] top-2 w-px bg-line/70" />

            {AUTH_PHASES.map((phase, index) => {
              const phaseNumber = index + 1;
              const phaseState =
                phaseNumber < flow.step
                  ? "done"
                  : phaseNumber === flow.step
                    ? "active"
                    : "idle";

              return (
                <li key={phase.code} className="relative flex items-center gap-3.5">
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-500 ${
                      phaseState === "done"
                        ? "border-ok/60 bg-ok/10 text-ok"
                        : phaseState === "active"
                          ? "border-flux bg-void text-flux shadow-[0_0_16px_-2px_rgba(56,189,248,0.8)]"
                          : "border-line bg-void text-fog/50"
                    }`}
                  >
                    {phaseState === "done" ? <FiCheck className="h-3 w-3" /> : phase.id}
                  </span>

                  <div>
                    <p
                      className={`font-mono text-[10px] font-bold tracking-[0.2em] ${
                        phaseState === "active"
                          ? "text-flux"
                          : phaseState === "done"
                            ? "text-ok/80"
                            : "text-fog/50"
                      }`}
                    >
                      T·{phase.code}
                    </p>
                    <p
                      className={`text-[12.5px] font-medium ${
                        phaseState === "idle" ? "text-fog/60" : "text-mist"
                      }`}
                    >
                      {phase.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-9 rounded-md border border-line/60 bg-hull/30 p-3.5">
            <p className="mono-label text-fog/50">sys note</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog/80">
              Демо-режим: данные не покидают ваш браузер.
            </p>
          </div>
        </aside>

        <div className="min-h-[420px] p-6 md:p-8">
          {flow.step === 1 && (
            <div key={`s1-${flow.attempt}`} className={flow.attempt ? "shake" : "step-in"}>
              <p className="mono-label text-flux">шаг 01 · идентификация</p>

              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Вход или регистрация
              </h3>

              <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                Укажите рабочий email — проверим, есть ли аккаунт, и отправим код
                подтверждения.
              </p>

              <form onSubmit={flow.submitEmail} className="mt-6" noValidate>
                <Input
                  id="auth-email"
                  label="email"
                  type="email"
                  autoFocus
                  autoComplete="off"
                  value={flow.email}
                  onChange={(event) => flow.setEmail(event.target.value)}
                  placeholder="you@company.ru"
                  iconLeft={<FiMail className="h-4 w-4" />}
                  iconRight={
                    flow.emailValid ? <FiCheck className="h-4 w-4 text-ok" /> : undefined
                  }
                  error={flow.emailErr}
                />

                <Button
                  type="submit"
                  variant="primary"
                  tone="flux"
                  disabled={flow.checking}
                  className="group mt-5 w-full sm:w-auto"
                  iconRight={
                    <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  }
                >
                  {flow.checking ? "Проверка…" : "Продолжить"}
                </Button>
              </form>

              <div className="mt-7">
                <div className="flex items-center gap-4">
                  <span className="h-px flex-1 bg-line/60" />
                  <span className="mono-label text-fog/50">или через</span>
                  <span className="h-px flex-1 bg-line/60" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {SOCIALS.map((social) => (
                    <Button
                      key={social.name}
                      variant="secondary"
                      onClick={() => flow.showSocialNote(social.name)}
                      iconLeft={social.mark}
                      className="!px-3 !py-3 !text-[13px] hover:-translate-y-0.5 hover:!border-flux/50 hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.5)]"
                    >
                      {social.name}
                    </Button>
                  ))}
                </div>

                {flow.socialNote && (
                  <p className="mt-3 flex items-start gap-2 rounded-md border border-warn/25 bg-warn/5 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-warn/90">
                    <StatusDot color="var(--color-warn)" />
                    {flow.socialNote}
                  </p>
                )}
              </div>

              <p className="mono-label mt-6 text-fog/40">
                продолжая, вы принимаете условия обработки данных
              </p>
            </div>
          )}

          {flow.step === 2 && (
            <div key={`s2-${flow.attempt}`} className={flow.attempt ? "shake" : "step-in"}>
              <p className="mono-label text-flux">шаг 02 · подтверждение email</p>

              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                Введите код из письма
              </h3>

              <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                6-значный код отправлен на{" "}
                <span className="font-mono text-[12.5px] text-mist">{flow.email}</span>.
              </p>

              <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-flux/90">
                <StatusDot color="var(--color-flux)" />
                {flow.mode === "login"
                  ? "аккаунт найден — после кода останется ввести пароль"
                  : "аккаунт не найден — после кода придумаем пароль"}
              </p>

              <div onPaste={flow.onDigitPaste} className="mt-7 flex justify-start gap-2 sm:gap-2.5">
                {flow.digits.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(element) => {
                      flow.boxRefs.current[index] = element;
                    }}
                    value={digit}
                    onChange={(event) => flow.onDigitChange(index, event.target.value)}
                    onKeyDown={(event) => flow.onDigitKey(index, event)}
                    inputMode="numeric"
                    maxLength={2}
                    autoFocus={index === 0}
                    autoComplete="off"
                    aria-label={`Цифра кода ${index + 1}`}
                    className={`!h-14 !w-11 !px-0 !py-0 !text-center !font-mono !text-xl !font-bold sm:!w-12 ${
                      flow.codeErr ? "!border-crit/60" : digit ? "!border-flux/50" : ""
                    }`}
                  />
                ))}
              </div>

              {flow.codeErr && (
                <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-crit">
                  <StatusDot color="var(--color-crit)" /> {flow.codeErr}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line/70 bg-void/60 px-4 py-3">
                <p className="font-mono text-[11px] text-fog/70">
                  Код отправлен на {flow.email}
                </p>

                {flow.sent && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ok/80">
                    transmitted
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {flow.timer > 0 ? (
                  <span className="mono-label text-fog/55">
                    повторная отправка через 0:{String(flow.timer).padStart(2, "0")}
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={flow.resend}
                    className="w-fit !px-4 !py-2.5 !text-[12.5px] hover:!border-flux/60 hover:!text-flux"
                  >
                    Отправить код повторно
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={flow.backToEmail}
                  className="sm:ml-auto hover:!text-flux"
                >
                  ← изменить email
                </Button>
              </div>
            </div>
          )}

          {flow.step === 3 && (
            <div key={`s3-${flow.attempt}`} className={flow.attempt ? "shake" : "step-in"}>
              <p className="mono-label text-flux">
                шаг 03 · {flow.mode === "login" ? "ключ доступа" : "новый ключ"}
              </p>

              <h3 className="font-display mt-2 text-xl font-bold text-snow md:text-2xl">
                {flow.mode === "login" ? "Введите пароль" : "Создайте пароль"}
              </h3>

              <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                {flow.mode === "login" ? "Ключ от аккаунта" : "Ключ для аккаунта"}{" "}
                <span className="font-mono text-[12.5px] text-mist">{flow.email}</span>.
                {flow.mode === "register" && " Требования проверяются в реальном времени."}
              </p>

              <form onSubmit={flow.submitPw} className="mt-6" noValidate>
                <Input
                  id="auth-pw"
                  label="пароль"
                  type={flow.showPw ? "text" : "password"}
                  autoFocus
                  autoComplete={flow.mode === "login" ? "current-password" : "new-password"}
                  value={flow.pw}
                  onChange={(event) => flow.setPw(event.target.value)}
                  placeholder="••••••••••"
                  iconLeft={<FiLock className="h-4 w-4" />}
                  error={flow.pwErr}
                  addonRight={
                    <Button
                      variant="ghost"
                      onClick={() => flow.setShowPw(!flow.showPw)}
                      aria-label={flow.showPw ? "Скрыть пароль" : "Показать пароль"}
                      className="!p-0 !text-fog/60 hover:!text-flux"
                    >
                      {flow.showPw ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </Button>
                  }
                />

                {flow.mode === "register" && (
                  <>
                    <div className="mt-3.5">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-hull/80">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: flow.pw ? flow.strengthMeta.w : "0%",
                            background: flow.strengthMeta.color,
                            boxShadow: `0 0 10px ${flow.strengthMeta.color}`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="mono-label text-fog/50">надёжность</span>
                        <span
                          className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
                          style={{
                            color: flow.pw ? flow.strengthMeta.color : "var(--color-fog)",
                          }}
                        >
                          {flow.pw ? flow.strengthMeta.label : "—"}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {flow.rules.map((rule) => (
                        <li key={rule.label} className="flex items-center gap-2.5 text-[13px]">
                          <span
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all duration-300 ${
                              rule.ok
                                ? "border-ok/60 bg-ok/10 text-ok"
                                : "border-line text-fog/40"
                            }`}
                          >
                            {rule.ok && <FiCheck className="h-2.5 w-2.5" />}
                          </span>
                          <span className={rule.ok ? "text-mist" : "text-fog/70"}>
                            {rule.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5">
                      <Input
                        id="auth-pw2"
                        label="повторите пароль"
                        type={flow.showPw ? "text" : "password"}
                        autoComplete="new-password"
                        value={flow.pw2}
                        onChange={(event) => flow.setPw2(event.target.value)}
                        placeholder="••••••••••"
                        warn={
                          flow.pw2.length > 0 && flow.pw2 !== flow.pw
                            ? "пароли пока не совпадают"
                            : undefined
                        }
                        ok={
                          flow.pw2.length > 0 && flow.pw2 === flow.pw
                            ? "совпадает"
                            : undefined
                        }
                      />
                    </div>
                  </>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    variant="primary"
                    tone="flux"
                    disabled={flow.submitting || (flow.mode === "register" && !flow.pwValid)}
                  >
                    {flow.submitting
                      ? "Загрузка…"
                      : flow.mode === "login"
                        ? "Войти"
                        : "Завершить регистрацию"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={flow.backToEmail}
                    className="hover:!text-flux"
                  >
                    ← изменить email
                  </Button>
                </div>
              </form>
            </div>
          )}

          {flow.step === 4 && (
            <div className="step-in">
              <div className="flex items-start gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ok/50 bg-ok/10 shadow-[0_0_30px_-6px_rgba(52,211,153,0.5)]">
                  <FiCheck className="h-7 w-7 text-ok" />
                </span>

                <div>
                  <p className="mono-label text-ok">mission start · complete</p>

                  <h3 className="font-display mt-1.5 text-xl font-bold text-snow md:text-2xl">
                    Операционный контур активен
                  </h3>

                  <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
                    Аккаунт создан, email подтверждён. Оператор MyCOO свяжется с
                    вами для конфигурации и запуска.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-2 rounded-md border border-line/70 bg-void/60 p-4 font-mono text-[12px]">
                {[
                  { t: "identity verified", d: 0.15 },
                  { t: "security key stored", d: 0.45 },
                  { t: "email confirmed", d: 0.75 },
                  { t: "mycoo core · online", d: 1.05 },
                ].map((line) => (
                  <p
                    key={line.t}
                    className="log-in flex items-center gap-2.5 text-fog/85"
                    style={{ animationDelay: `${line.d}s` }}
                  >
                    <span className="text-ok">▸</span> {line.t}
                    {line.t.includes("online") && <StatusDot />}
                  </p>
                ))}
              </div>

              <div className="mt-5 grid gap-2.5 rounded-md border border-line/70 bg-hull/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="mono-label text-fog/55">аккаунт</p>
                  <p className="mt-1 truncate font-mono text-[13px] text-mist">{flow.email}</p>
                </div>

                <div>
                  <p className="mono-label text-fog/55">метод доступа</p>
                  <p className="mt-1 font-mono text-[13px] text-mist">email + key · verified</p>
                </div>

                <div>
                  <p className="mono-label text-fog/55">req id</p>
                  <p className="mt-1 font-mono text-[13px] text-mist">{flow.requestId}</p>
                </div>

                <div>
                  <p className="mono-label text-fog/55">статус</p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[13px] text-ok">
                    <StatusDot /> onboard
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="primary"
                  tone="ion"
                  onClick={startOnboarding}
                  className="group"
                  iconRight={
                    <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  }
                >
                  Начать знакомство с MyCOO
                </Button>

                <Button variant="secondary" onClick={closeModal}>
                  Вернуться на борт
                </Button>
              </div>

              <p className="mono-label mt-4 text-fog/45">
                следующий шаг · бриф компании ~5 минут
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}