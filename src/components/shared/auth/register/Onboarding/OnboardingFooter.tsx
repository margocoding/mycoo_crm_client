import type { ReactNode } from "react";
import Button from "../../../../ui/Button";

interface OnboardingFooterProps {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextTone?: "flux" | "ion";
  nextDisabled?: boolean;
  nextIconRight?: ReactNode;
  children?: ReactNode;
}

export default function OnboardingFooter({
  onNext,
  onBack,
  nextLabel = "Далее →",
  nextTone = "ion",
  nextDisabled,
  nextIconRight,
  children,
}: OnboardingFooterProps) {
  return (
    <div className="mt-7 flex items-center gap-3">
      <Button
        onClick={onNext}
        tone={nextTone}
        disabled={nextDisabled}
        iconRight={nextIconRight}
      >
        {nextLabel}
      </Button>
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          ← назад
        </Button>
      )}
      {children}
    </div>
  );
}