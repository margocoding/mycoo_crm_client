import { useCallback, useEffect, useMemo, useState } from "react";
import { useModalRouter } from "./useModalRouter";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useLaunchStore } from "@/store/launch.store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SITE_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;

export function useOnboardingFlow() {
  const { state, closeModal: close, openModal } = useModalRouter();
  const user = useAuthStore((s) => s.user);
  const regEmail = user?.email ?? "";
  const launch = useLaunchStore();
  const { profile, loading, error, setField, restore, saveStep, clearError } = useOnboardingStore();

  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const synced = Boolean(launch.workspace?.onboardingComplete);

  const open = state.modal === "onboarding" && Boolean(user) && launch.loadedFor === user?.id && !launch.loading && !launch.error;
  const closeModal = useCallback(() => { if (!useOnboardingStore.getState().loading) close(); }, [close]);

  useEffect(() => {
    if (!open) return;
    const workspace = useLaunchStore.getState().workspace;
    restore(workspace, regEmail);
    setStep(workspace ? Math.min(workspace.onboardingStep + 1, 4) : 0);
    setAttempt(0);
  }, [open, regEmail, restore]);


  const fail = (m: string) => {
    useOnboardingStore.setState({ error: m });
    setAttempt((a) => a + 1);
  };

  const next = async () => {
    if (useOnboardingStore.getState().loading) return;
    clearError();
    if (step === 1) {
      if (!profile.company.trim()) return fail("Укажите название компании — это первая точка контекста.");
      if (!profile.industry) return fail("Выберите отрасль.");
      if (profile.industry === "Другое" && !profile.industryOther.trim())
        return fail("Опишите, чем занимается компания — вы выбрали «Другое».");
      if (!profile.employees) return fail("Укажите количество сотрудников.");
      if (!profile.managers) return fail("Укажите количество руководителей.");
      if (!profile.stage) return fail("Выберите стадию бизнеса.");
      if (profile.site.trim() && !SITE_RE.test(profile.site.trim()))
        return fail("Похоже, адрес сайта некорректен — пример: company.ru");
    }
    if (step === 2) {
      if (!profile.ownerName.trim()) return fail("Как к вам обращаться?");
      if (!profile.ownerRole) return fail("Выберите вашу роль.");
      if (profile.ownerRole === "Другое" && !profile.roleOther.trim())
        return fail("Укажите вашу должность — вы выбрали «Другое».");
      if (!EMAIL_RE.test(profile.ownerEmail.trim())) return fail("Email для связи не распознан.");
    }
    if (step === 3) {
      if (!profile.goal.trim()) return fail("Сформулируйте главную цель компании.");
      if (!profile.problem.trim()) return fail("Опишите главную проблему сейчас — без неё MyCOO слеп.");
      const prioCount = [profile.p1, profile.p2, profile.p3].filter((x) => x.trim()).length;
      if (prioCount < 1) return fail("Добавьте хотя бы один приоритет.");
    }
    try {
      if (step >= 1 && step <= 3) await saveStep(step);
      setAttempt(0);
      setStep((s) => s + 1);
    } catch { setAttempt((a) => a + 1); }
  };

  const back = useCallback(
    (target: number) => {
      if (useOnboardingStore.getState().loading) return;
      clearError();
      setStep(target);
    },
    [clearError]
  );

  const prioCount = useMemo(
    () => [profile.p1, profile.p2, profile.p3].filter((x) => x.trim()).length,
    [profile.p1, profile.p2, profile.p3]
  );

  const summary = useMemo<[string, string][]>(() => {
    const industryValue =
      profile.industry === "Другое" && profile.industryOther.trim()
        ? profile.industryOther.trim()
        : profile.industry;
    const roleValue =
      profile.ownerRole === "Другое" && profile.roleOther.trim()
        ? profile.roleOther.trim()
        : profile.ownerRole;
    const stages: Record<string, string> = {
      startup: "Стартап",
      growth: "Рост",
      mature: "Зрелость",
      transform: "Трансформация",
    };
    const stageLabel = stages[profile.stage] ?? profile.stage;

    const items: [string, string][] = [
      ["Компания", profile.company],
      ["Сайт", profile.site || "—"],
      ["Отрасль", industryValue || "—"],
      ["Масштаб", `${profile.employees || "—"} сотр. · ${profile.managers || "—"} рук.`],
      ["Стадия", stageLabel],
      ["Оборот", profile.revenue || "не указан"],
      ["Контакт", `${profile.ownerName} (${roleValue || "—"})`],
      ["Email", profile.ownerEmail],
      ["Главная цель", profile.goal],
      ["Главная проблема", profile.problem],
      ["Приоритеты", [profile.p1, profile.p2, profile.p3].filter(Boolean).join(" · ") || "—"],
    ];

    return items.filter(([, value]) => value !== "—" && value !== "");
  }, [profile]);

  const complete = () => {
    if (useOnboardingStore.getState().loading) return;
    if (!useLaunchStore.getState().workspace?.onboardingComplete) return fail("Сначала сохраните все шаги брифа.");
    openModal("diagnostics");
  };

  const progress = useMemo(() => [6, 30, 55, 80, 100][step] ?? 6, [step]);

  return {
    open,
    step,
    attempt,
    synced,
    profile,
    error,
    loading,
    prioCount,
    summary,
    progress,
    regEmail,
    setField,
    next,
    back,
    complete,
    closeModal,
  };
}
