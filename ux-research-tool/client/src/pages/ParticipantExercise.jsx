import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import TreejackExercise from '../components/participant/TreejackExercise';
import CardSortExercise from '../components/participant/CardSortExercise';
import styles from './ParticipantExercise.module.css';

export default function ParticipantExercise() {
  const { token }  = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();

  const participantName  = location.state?.name  || sessionStorage.getItem(`participant_${token}_name`);
  const participantEmail = location.state?.email || sessionStorage.getItem(`participant_${token}_email`);

  const [study, setStudy]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participantName || !participantEmail) {
      navigate(`/s/${token}`, { replace: true });
      return;
    }
    api.get(`/public/${token}`)
      .then(res => setStudy(res.data))
      .catch(() => navigate(`/s/${token}`, { replace: true }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className={styles.page}><p className={styles.muted}>Loading…</p></div>;
  }

  const participant = { name: participantName, email: participantEmail };

  if (study.type === 'card_sort') {
    return <CardSortExercise study={study} token={token} participant={participant} />;
  }

  return <TreejackExercise study={study} token={token} participant={participant} />;
}
