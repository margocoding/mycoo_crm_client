import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export type AuthStep = "email" | "code" | "password" | "complete";
export type ModalType = "auth" | "onboarding" | "diagnostics" | "subscription" | null;

interface ModalState {
  modal: ModalType;
  authStep: AuthStep | null;
  authMode: "login" | "register" | null;
  email: string | null;
  provider: string | null;
}

export function useModalRouter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<ModalState>(() => {
    const auth = searchParams.get("auth");
    const onboarding = searchParams.get("onboarding");
    const diagnostics = searchParams.get("diagnostics");
    const subscription = searchParams.get("subscription");

    let modal: ModalType = null;
    let authStep: AuthStep | null = null;
    let authMode: "login" | "register" | null = null;

    if (auth) {
      modal = "auth";
      if (auth === "code") authStep = "code";
      else if (auth === "password") authStep = "password";
      else if (auth === "complete") authStep = "complete";
      else authStep = "email";

      const mode = searchParams.get("mode");
      if (mode === "login" || mode === "register") {
        authMode = mode;
      }
    } else if (onboarding) {
      modal = "onboarding";
    } else if (diagnostics) {
      modal = "diagnostics";
    } else if (subscription) {
      modal = "subscription";
    }

    return {
      modal,
      authStep,
      authMode,
      email: searchParams.get("email"),
      provider: searchParams.get("provider"),
    };
  }, [searchParams]);

  const openModal = useCallback(
    (type: ModalType, params?: Record<string, string>) => {
      const newParams = new URLSearchParams();

      if (type === "auth") {
        newParams.set("auth", params?.step || "email");
        if (params?.mode) newParams.set("mode", params.mode);
        if (params?.email) newParams.set("email", params.email);
        if (params?.provider) newParams.set("provider", params.provider);
      } else if (type === "onboarding") {
        newParams.set("onboarding", "true");
      } else if (type === "diagnostics") {
        newParams.set("diagnostics", "true");
      } else if (type === "subscription") {
        newParams.set("subscription", "true");
      }

      setSearchParams(newParams, { replace: true });
    },
    [setSearchParams]
  );

  const closeModal = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const updateAuthStep = useCallback(
    (step: AuthStep, params?: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("auth", step);
      
      if (params?.mode) newParams.set("mode", params.mode);
      if (params?.email) newParams.set("email", params.email);
      if (params?.provider) newParams.set("provider", params.provider);

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return {
    state,
    openModal,
    closeModal,
    updateAuthStep,
  };
}