import { createRoot } from 'react-dom/client';
import { App } from './ui/App.tsx';
import './ui/styles.css';
import { startPwa } from './ui/pwa.ts';
import { startStats } from './ui/stats.ts';

createRoot(document.getElementById('app')!).render(<App />);
startPwa();
startStats();
