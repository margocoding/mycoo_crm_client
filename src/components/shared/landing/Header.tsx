import { useEffect, useState } from "react";
import { Logo } from "../../icons";
import { StatusDot } from "../../ui/Ambient";
import { FiX, FiMenu } from "react-icons/fi";
import Button from "../../ui/Button";
import { useLaunch } from "@/store/launch.store";
import { useModalRouter } from "@/hooks/useModalRouter";

const NAV = [
  { href: "#about", label: "О системе" },
  { href: "#how", label: "Как работает" },
  { href: "#features", label: "Возможности" },
  { href: "#cases", label: "Кейсы" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "FAQ" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const { trialActive } = useLaunch();
  const { openModal } = useModalRouter();

  const launch = () => openModal("auth", { step: "email" });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "header-solid py-0" : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 md:px-8 transition-all duration-500 ${
          scrolled ? "h-14" : "h-18"
        }`}
      >
        <a href="#top" className="group flex items-center gap-3">
          <Logo className="h-7 w-7 transition-transform duration-500 group-hover:rotate-45" />
          <span className="font-display text-[15px] font-bold tracking-[0.22em] text-snow">
            MYCOO
          </span>
          <span className="hidden items-center gap-2 rounded border border-line bg-hull/60 px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-ok sm:inline-flex">
            <StatusDot />
            AI COO / ONLINE
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="relative text-[13px] font-medium text-fog transition-colors duration-300 hover:text-snow after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-flux after:transition-all after:duration-300 hover:after:w-full"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            tone="flux"
            onClick={launch}
            className="hidden !px-4 !py-2.5 !text-[13px] sm:inline-flex"
          >
            {trialActive ? "Открыть MyCOO" : "Запустить MyCOO"}
          </Button>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-mist transition-colors hover:border-flux/50 hover:text-snow lg:hidden"
          >
            {open ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-line/40">
        <div
          className="h-full bg-gradient-to-r from-flux/40 via-flux to-ion"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div
        className={`overflow-hidden border-b border-line bg-void/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-5">
          {NAV.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-3 text-[15px] font-medium text-mist transition-colors hover:bg-hull hover:text-snow"
            >
              {n.label}
              <span className="font-mono text-[10px] text-fog/50">0{i + 1}</span>
            </a>
          ))}
          <Button
            variant="primary"
            tone="flux"
            onClick={() => {
              setOpen(false);
              launch();
            }}
            className="mt-3 w-full !py-3 !text-[14px]"
          >
            {trialActive ? "Открыть MyCOO" : "Запустить MyCOO"}
          </Button>
        </nav>
      </div>
    </header>
  );
}