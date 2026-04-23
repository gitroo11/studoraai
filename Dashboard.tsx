import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, FileText, HelpCircle, Layers, Flame, Brain, ArrowRight } from 'lucide-react';
import { getStudentName, getGroqApiKey, getUserId } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface Activity {
  feature: string;
  studied_at: string;
}

const featureCards = [
  {
    to: '/voice-chat',
    icon: Mic,
    title: 'Chat por Voz',
    desc: 'Fala com o AI e recebe respostas em tempo real',
    gradient: 'from-accent-500/20 to-accent-700/20',
    iconColor: 'text-accent-400',
  },
  {
    to: '/summary',
    icon: FileText,
    title: 'Resumo Inteligente',
    desc: 'Transforma textos longos em resumos claros',
    gradient: 'from-emerald-500/20 to-emerald-700/20',
    iconColor: 'text-emerald-400',
  },
  {
    to: '/quiz',
    icon: HelpCircle,
    title: 'Gerador de Quiz',
    desc: 'Cria quizzes personalizados do teu material',
    gradient: 'from-amber-500/20 to-amber-700/20',
    iconColor: 'text-amber-400',
  },
  {
    to: '/flashcards',
    icon: Layers,
    title: 'Flashcards',
    desc: 'Cartões de estudo com repetição espaçada',
    gradient: 'from-rose-500/20 to-rose-700/20',
    iconColor: 'text-rose-400',
  },
];

const featureLabels: Record<string, string> = {
  voice_chat: 'Chat por Voz',
  summary: 'Resumo Inteligente',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
};

export default function Dashboard() {
  const name = getStudentName();
  const hasApiKey = !!getGroqApiKey();
  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const userId = getUserId();

  useEffect(() => {
    async function loadData() {
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('feature, studied_at')
        .eq('user_id', userId)
        .order('studied_at', { ascending: false })
        .limit(10);

      if (sessions && sessions.length > 0) {
        setActivities(sessions);

        const uniqueDates = [...new Set(sessions.map((s) => s.studied_at))];
        let count = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          if (uniqueDates.includes(dateStr)) {
            count++;
          } else {
            break;
          }
        }
        setStreak(count);
      }
    }
    loadData();
  }, [userId]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-dark-100">
          {greeting}, <span className="text-gradient">{name}</span>
        </h1>
        {!hasApiKey && (
          <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            Insere a tua Groq API key nas <Link to="/settings" className="underline font-medium">Definições</Link> para começar.
          </div>
        )}
        <p className="text-dark-400">
          Pronto para aprender? Escolhe uma ferramenta abaixo.
        </p>
      </div>

      {/* Streak */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-dark-100">{streak}</div>
          <div className="text-sm text-dark-400">
            {streak === 1 ? 'dia seguido' : 'dias seguidos'} de estudo
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {featureCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="card-hover group flex items-start gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0`}
            >
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-dark-200 group-hover:text-dark-100 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-dark-500 mt-0.5">{card.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-dark-600 group-hover:text-accent-400 transition-all group-hover:translate-x-0.5 mt-1 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-dark-200 flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-400" />
            Atividade Recente
          </h2>
          <div className="card space-y-2">
            {activities.slice(0, 5).map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-dark-700/50 last:border-0"
              >
                <span className="text-sm text-dark-300">
                  {featureLabels[activity.feature] || activity.feature}
                </span>
                <span className="text-xs text-dark-500">
                  {new Date(activity.studied_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
