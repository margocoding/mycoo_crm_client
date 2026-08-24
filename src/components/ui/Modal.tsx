import { useEffect, type ReactNode } from "react";
import { Logo } from "../icons";
import { StatusChip } from "./Ambient";

export interface ModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Callback при закрытии */
  onClose: () => void;
  /** Дочерние элементы */
  children: ReactNode;
  /** Z-index модалки (по умолчанию 70) */
  zIndex?: number;
  /** Максимальная ширина модалки */
  maxWidth?: string;
  /** Дополнительные классы для контейнера */
  className?: string;
  /** Показывать ли логотип в хедере */
  showLogo?: boolean;
  /** Заголовок модалки */
  title?: ReactNode;
  /** Подзаголовок модалки */
  subtitle?: ReactNode;
  /** Статус чип в хедере */
  statusChip?: {
    tone: "flux" | "ion" | "ok" | "warn" | "crit";
    text: string;
  };
  /** Показывать ли прогресс бар (полоска сверху) */
  showProgress?: boolean;
  /** Значение прогресса (0-100) */
  progress?: number;
  /** Цвет прогресс бара (по умолчанию flux) */
  progressColor?: string;
  /** Aria-label для доступности */
  ariaLabel?: string;
}

/**
 * Универсальный компонент модального окна
 * Используется в регистрации, онбординге, диагностике и других местах
 */
export function Modal({
  isOpen,
  onClose,
  children,
  zIndex = 70,
  maxWidth = "max-w-4xl",
  className = "",
  showLogo = true,
  title,
  subtitle,
  statusChip,
  showProgress = false,
  progress = 0,
  progressColor = "var(--color-flux)",
  ariaLabel = "Модальное окно",
}: ModalProps) {
  // Блокировка скролла body и обработка Escape
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-void/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{ zIndex }}
    >
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`corner glass step-in relative w-full ${maxWidth} rounded-xl shadow-[0_0_90px_-20px_rgba(56,189,248,0.35)] ${className}`}
        >
          <span className="cx pointer-events-none absolute inset-0" />

          {/* Header */}
          {(title || statusChip) && (
            <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 md:px-7">
              <div className="flex items-center gap-3">
                {showLogo && <Logo className="h-7 w-7" />}
                <div>
                  {title && (
                    <p className="font-display text-[13px] font-bold tracking-[0.18em] text-snow">
                      {title}
                    </p>
                  )}
                  {subtitle && (
                    <p className="mono-label text-fog/50">{subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusChip && (
                  <span className="hidden sm:block">
                    <StatusChip tone={statusChip.tone}>{statusChip.text}</StatusChip>
                  </span>
                )}
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-fog transition-all duration-300 hover:border-crit/60 hover:text-crit"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {showProgress && (
            <div className="h-0.5 w-full bg-hull/60">
              <div
                className="h-full shadow-[0_0_12px_rgba(56,189,248,0.8)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, backgroundColor: progressColor }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
