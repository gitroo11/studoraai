import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VoiceChat from './pages/VoiceChat';
import SmartSummary from './pages/SmartSummary';
import QuizGenerator from './pages/QuizGenerator';
import Flashcards from './pages/Flashcards';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/voice-chat" element={<VoiceChat />} />
          <Route path="/summary" element={<SmartSummary />} />
          <Route path="/quiz" element={<QuizGenerator />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
