import { useEffect, useRef, type ReactNode } from "react";
import { Reveal, useCountUp, useInView, useReducedMotion } from "../../lib/motion";

/* ---------------- starfield ---------------- */

type Star = { x: number; y: number; r: number; a: number; sp: number; ph: number };

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(190, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.15 + 0.25,
        a: Math.random() * 0.5 + 0.15,
        sp: Math.random() * 1.4 + 0.3,
        ph: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 1 : 0.62 + 0.38 * Math.sin(t * 0.001 * s.sp + s.ph);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.r > 0.95 ? "#bcd9ff" : "#e8f2ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    seed();
    if (reduced) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      seed();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}

/* ---------------- orbit rings with travelling dots ---------------- */

export function OrbitRings({
  className = "",
  size = 640,
}: {
  className?: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const s = size;
  const c = s / 2;
  const rings = [
    { r: s * 0.28, dur: "26s", color: "#38bdf8", rev: false },
    { r: s * 0.38, dur: "44s", color: "#8b85f8", rev: true },
    { r: s * 0.47, dur: "64s", color: "#7dd3fc", rev: false },
  ];
  return (
    <svg
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      aria-hidden="true"
      style={{ width: s, height: s }}
    >
      {rings.map((ring, i) => {
        const id = `orb-${i}-${ring.r}`;
        return (
          <g key={i}>
            <circle
              id={id}
              cx={c}
              cy={c}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeOpacity="0.16"
              strokeDasharray="3 7"
              className={ring.rev ? "spin-slower" : "spin-slow"}
            />
            {!reduced && (
              <circle r={i === 1 ? 3 : 2.4} fill={ring.color}>
                <animateMotion
                  dur={ring.dur}
                  repeatCount="indefinite"
                  path={`M ${c + ring.r} ${c} A ${ring.r} ${ring.r} 0 1 ${
                    ring.rev ? 0 : 1
                  } ${c - ring.r} ${c} A ${ring.r} ${ring.r} 0 1 ${
                    ring.rev ? 0 : 1
                  } ${c + ring.r} ${c}`}
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- section heading ---------------- */

export function SectionHeading({
  index,
  label,
  title,
  meta,
  children,
  align = "left",
}: {
  index: string;
  label: string;
  title: ReactNode;
  meta?: string;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Reveal>
      <div
        className={`mb-12 md:mb-16 flex flex-col gap-5 ${
          align === "center" ? "items-center text-center" : ""
        }`}
      >
        <div
          className={`flex items-center gap-4 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className="mono-label text-flux">
            <span className="text-fog/60">//</span> {index}
          </span>
          <span className="h-px w-10 bg-line" />
          <span className="mono-label text-fog">{label}</span>
          {meta && (
            <span className="mono-label hidden text-fog/50 md:inline">· {meta}</span>
          )}
        </div>
        <h2 className="font-display text-[clamp(1.45rem,3.4vw,2.5rem)] font-semibold leading-[1.14] tracking-tight text-snow max-w-3xl">
          {title}
        </h2>
        {children && <div className="max-w-2xl text-[15px] leading-relaxed text-fog">{children}</div>}
      </div>
    </Reveal>
  );
}

/* ---------------- status chip ---------------- */

export function StatusDot({ color = "var(--color-ok)" }: { color?: string }) {
  return (
    <span
      className="dot-live inline-block h-[7px] w-[7px] rounded-full"
      style={{ backgroundColor: color, color }}
    />
  );
}

export function StatusChip({
  tone = "ok",
  children,
}: {
  tone?: "ok" | "warn" | "crit" | "flux" | "ion";
  children: ReactNode;
}) {
  const map = {
    ok: { dot: "var(--color-ok)", text: "text-ok/90", border: "border-ok/25 bg-ok/5" },
    warn: { dot: "var(--color-warn)", text: "text-warn/90", border: "border-warn/25 bg-warn/5" },
    crit: { dot: "var(--color-crit)", text: "text-crit/90", border: "border-crit/25 bg-crit/5" },
    flux: { dot: "var(--color-flux)", text: "text-flux/90", border: "border-flux/25 bg-flux/5" },
    ion: { dot: "var(--color-ion)", text: "text-ion/90", border: "border-ion/25 bg-ion/5" },
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase ${map.border} ${map.text}`}
    >
      <StatusDot color={map.dot} />
      {children}
    </span>
  );
}

/* ---------------- progress bar ---------------- */

export function Bar({
  label,
  value,
  color = "var(--color-flux)",
  delay = 0,
  sub,
}: {
  label: string;
  value: number;
  color?: string;
  delay?: number;
  sub?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const v = useCountUp(value, inView);
  return (
    <div ref={ref}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-mist">{label}</span>
        <span className="font-mono text-[11px] text-fog">
          {sub ? `${sub} · ` : ""}
          <span style={{ color }}>{v}%</span>
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-hull">
        <div
          className="bar-fill h-full rounded-full"
          style={{
            width: inView ? `${value}%` : "0%",
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 10px ${color}66`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- misc ---------------- */

export function Corners() {
  return <span className="cx absolute inset-0 pointer-events-none" aria-hidden="true" />;
}

export function CoordTag({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`mono-label pointer-events-none select-none text-fog/35 ${className}`}>
      {text}
    </span>
  );
}
