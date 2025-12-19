import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { useGameStore } from './store/gameStore';

function App() {
  const darkMode = useGameStore(state => state.darkMode);

  // Apply dark mode class on mount and when darkMode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900">
      <Dashboard />
    </div>
  );
}

export default App;
