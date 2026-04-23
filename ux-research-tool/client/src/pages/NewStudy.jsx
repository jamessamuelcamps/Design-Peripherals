import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import styles from './NewStudy.module.css';

const STUDY_TYPES = [
  {
    type: 'treejack',
    icon: '🌳',
    title: 'Treejack',
    description: 'Test how easily participants can find items in your navigation structure.',
    defaultTitle: 'Untitled Treejack',
    defaultConfig: { tasks: [], tree: {} },
  },
  {
    type: 'card_sort',
    icon: '🗂️',
    title: 'Card Sort',
    description: 'Ask participants to categorise items into predefined groups.',
    defaultTitle: 'Untitled Card Sort',
    defaultConfig: { cards: [], categories: [] },
  },
];

export default function NewStudy() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(null);

  async function handleSelect(option) {
    if (creating) return;
    setCreating(option.type);
    try {
      const res = await api.post('/studies', {
        title: option.defaultTitle,
        type: option.type,
        config: option.defaultConfig,
      });
      navigate(`/studies/${res.data.id}/edit`);
    } catch {
      setCreating(null);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Choose a study type</h1>
      <div className={styles.cards}>
        {STUDY_TYPES.map(option => (
          <button
            key={option.type}
            className={styles.card}
            onClick={() => handleSelect(option)}
            disabled={!!creating}
          >
            <div className={styles.cardIcon}>{option.icon}</div>
            <div className={styles.cardTitle}>
              {option.title}
              {creating === option.type && ' …'}
            </div>
            <p className={styles.cardDesc}>{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
