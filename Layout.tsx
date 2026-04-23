import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  FileText,
  HelpCircle,
  Layers,
  Settings,
  Brain,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/voice-chat', icon: Mic, label: 'Voz' },
  { to: '/summary', icon: FileText, label: 'Resumo' },
  { to: '/quiz', icon: HelpCircle, label: 'Quiz' },
  { to: '/flashcards', icon: Layers, label: 'Flashcards' },
  { to: '/settings', icon: Settings, label: 'Definições' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900/80 border-r border-dark-800 p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">Studora</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent-500/15 text-accent-400'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/60'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-dark-800">
          <div className="px-3 py-2 text-xs text-dark-500">
            Powered by AI
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800 z-50">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all duration-200 min-w-[3.5rem]"
              >
                <div
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-500/20 text-accent-400'
                      : 'text-dark-500'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? 'text-accent-400' : 'text-dark-500'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
