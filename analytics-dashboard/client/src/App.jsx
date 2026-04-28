import { useState } from 'react';
import { Dashboard } from './pages/Dashboard.jsx';
import styles from './App.module.css';

export default function App() {
  const [platform, setPlatform] = useState('web');
  return (
    <div className={styles.app}>
      <Dashboard platform={platform} onPlatformChange={setPlatform} />
    </div>
  );
}
