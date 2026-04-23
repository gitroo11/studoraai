import { getRandomLoadingMessage } from '../lib/groq';
import { useState, useEffect } from 'react';

export default function LoadingSpinner({ message }: { message?: string }) {
  const [msg, setMsg] = useState(message || getRandomLoadingMessage());

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setMsg(getRandomLoadingMessage());
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 animate-fade-in">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-dark-700" />
        <div className="absolute inset-0 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-dark-400 text-sm font-medium">{msg}</p>
    </div>
  );
}
