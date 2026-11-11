import { Starfield } from '@/components/ui/Ambient';

export default function DashboardBackground() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 30% -10%, rgba(30,58,138,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(139,133,248,0.09), transparent 65%), linear-gradient(180deg, #04070f 0%, #060b18 55%, #04070f 100%)' }} />
    <Starfield className="absolute inset-0 h-full w-full" />
    <div className="noise-overlay" />
  </div>;
}
