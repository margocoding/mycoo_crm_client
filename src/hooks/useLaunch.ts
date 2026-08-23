import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface Profile {
  role: string;
  teamSize: string;
  goals: string[];
}

export interface LaunchState {
  open: () => void;
  trialActive: boolean;
  view: "site" | "app";
  exitToSite: () => void;
  resetDemo: () => void;
  email: string;
  profile: Profile | null;
}

export function useLaunch(): LaunchState {
  const navigate = useNavigate();
  
  const [view, setView] = useState<"site" | "app">(() => {
    const savedView = localStorage.getItem("mycoo_view");
    return (savedView === "site" || savedView === "app") ? savedView : "site";
  });
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem("onboarding_complete") === "true";
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email");
    const savedProfile = localStorage.getItem("user_profile");
    if (savedEmail) setEmail(savedEmail);
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  const open = () => {
    if (onboardingComplete) {
      navigate("/dashboard");
    } else {
      window.dispatchEvent(new CustomEvent("open-registration"));
    }
  };

  const handleExitFromApp = () => {
    setView("site");
    localStorage.setItem("mycoo_view", "site");
  };

  const handleResetDemo = () => {
    setOnboardingComplete(false);
    setEmail("");
    setProfile(null);
    localStorage.removeItem("onboarding_complete");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("mycoo_view");
    setView("site");
  };

  return {
    open,
    trialActive: onboardingComplete,
    view,
    exitToSite: handleExitFromApp,
    resetDemo: handleResetDemo,
    email,
    profile: onboardingComplete ? profile : null
  };
}
