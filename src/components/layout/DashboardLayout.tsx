import { useState, ReactNode } from 'react';
import { Logo } from '../icons';
import { useLaunch } from '../Register';

interface SidebarProps {
  children: ReactNode;
}

const navItems = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊', path: '/dashboard' },
  { id: 'tasks', label: 'Задачи', icon: '✓', path: '/dashboard/tasks' },
  { id: 'team', label: 'Команда', icon: '👥', path: '/dashboard/team' },
  { id: 'reports', label: 'Отчёты', icon: '📈', path: '/dashboard/reports' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', path: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: SidebarProps) {
  const { exitToSite } = useLaunch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <div className="relative min-h-screen bg-void font-body text-mist">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-void/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 glass border-r border-line/50 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-line/40 px-5">
          <Logo className="h-7 w-7 shrink-0" />
          <span className="font-display text-[14px] font-bold tracking-[0.22em] text-snow">MYCOO</span>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.path}
              onClick={() => {
                setActiveItem(item.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                activeItem === item.id
                  ? 'bg-flux/10 text-snow border border-flux/20'
                  : 'text-fog/70 hover:text-mist hover:bg-hull/40'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-line/40 space-y-2">
          <button
            onClick={exitToSite}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fog/70 hover:text-mist hover:bg-hull/40 transition-all"
          >
            <span className="w-5 h-5 flex items-center justify-center text-base">🌐</span>
            На сайт
          </button>
          
          {/* User profile snippet */}
          <div className="flex items-center gap-3 rounded-lg bg-hull/30 px-3 py-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-flux to-ion flex items-center justify-center text-xs font-bold text-void">
              У
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-snow truncate">Пользователь</p>
              <p className="mono-label text-[9px] text-fog/50">Pro тариф</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line/40 bg-void/80 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-fog/70 hover:text-snow"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-display text-sm font-bold tracking-wider text-snow">MYCOO</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
