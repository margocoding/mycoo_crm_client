import { useEffect } from "react";

export interface RegisterStepLaunchProps {
  email: string;
  onComplete: () => void;
}

export function RegisterStepLaunch({ email, onComplete }: RegisterStepLaunchProps) {
  useEffect(() => {
    // Auto-complete after a short delay for animation
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-ok/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ok/20">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-ok" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-display text-xl font-bold tracking-[0.15em] text-snow">
          ЗАПУСК УСПЕШЕН
        </h2>
        <p className="mt-2 text-sm text-fog/70">
          Аккаунт <span className="text-flux">{email}</span> создан
        </p>
        <p className="mt-1 text-xs text-fog/50">
          Переходим к настройке профиля...
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1 w-2 animate-bounce rounded-full bg-flux/50" style={{ animationDelay: "0ms" }} />
        <div className="h-1 w-2 animate-bounce rounded-full bg-flux/50" style={{ animationDelay: "150ms" }} />
        <div className="h-1 w-2 animate-bounce rounded-full bg-flux/50" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
