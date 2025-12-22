import { useEffect } from 'react';
import Dashboard from './components/Dashboard';

function App() {
  // Always force dark mode on mount
  // This ensures dark theme works even if localStorage has stale darkMode: false
  useEffect(() => {
    // Always add 'dark' class - this app is dark-mode only
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900">
      <Dashboard />
    </div>
  );
}

export default App;
