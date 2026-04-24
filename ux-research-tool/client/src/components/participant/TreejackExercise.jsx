import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import ParticipantTree from './ParticipantTree';
import styles from './TreejackExercise.module.css';

function isDescendantOrSame(prev, curr) {
  if (curr.length < prev.length) return false;
  return prev.every((label, i) => curr[i] === label);
}

function countBacktracks(history) {
  let n = 0;
  for (let i = 1; i < history.length; i++) {
    if (!isDescendantOrSame(history[i - 1], history[i])) n++;
  }
  return n;
}

export default function TreejackExercise({ study, token, participant }) {
  const navigate = useNavigate();

  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [taskIdx, setTaskIdx]               = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedPath, setSelectedPath]     = useState(null);
  const [selectionHistory, setSelectionHistory] = useState([]);

  const taskStart = useRef(Date.now());

  useEffect(() => {
    taskStart.current = Date.now();
    setSelectedPath(null);
    setSelectionHistory([]);
  }, [taskIdx]);

  function handleSelect(labelPath) {
    setSelectionHistory(h => [...h, labelPath]);
    setSelectedPath(labelPath);
  }

  function handleConfirm() {
    if (!selectedPath) return;

    const task       = study.config.tasks[taskIdx];
    const timeSecs   = Math.round((Date.now() - taskStart.current) / 1000);
    const backtracks = countBacktracks([...selectionHistory]);

    const result = {
      task_id:            task.id,
      path_taken:         selectedPath,
      answer:             selectedPath[selectedPath.length - 1],
      time_taken_seconds: timeSecs,
      backtrack_count:    backtracks,
    };

    const updated = [...completedTasks, result];
    setCompletedTasks(updated);

    if (taskIdx < study.config.tasks.length - 1) {
      setTaskIdx(i => i + 1);
    } else {
      submit(updated);
    }
  }

  async function submit(taskResults) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/public/${token}/respond`, {
        participant_name:  participant.name,
        participant_email: participant.email,
        data: { tasks: taskResults },
      });
      sessionStorage.removeItem(`participant_${token}_name`);
      sessionStorage.removeItem(`participant_${token}_email`);
      navigate(`/s/${token}/done`);
    } catch {
      setSubmitError('Something went wrong submitting your response. Please try again.');
      setSubmitting(false);
    }
  }

  if (submitting) {
    return <div className={styles.page}><p className={styles.muted}>Submitting your response…</p></div>;
  }

  const tasks      = study.config.tasks;
  const totalTasks = tasks.length;
  const task       = tasks[taskIdx];
  const progress   = (taskIdx / totalTasks) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.container}>
        <p className={styles.progressLabel}>Task {taskIdx + 1} of {totalTasks}</p>

        <h1 className={styles.question}>{task.question}</h1>

        {submitError && (
          <div className={styles.errorBox}>
            <p>{submitError}</p>
            <button className={styles.retryBtn} onClick={() => submit(completedTasks)}>
              Try again
            </button>
          </div>
        )}

        <div className={styles.treeWrap}>
          <ParticipantTree
            key={taskIdx}
            tree={study.config.tree}
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        </div>

        {selectedPath && (
          <div className={styles.confirmBar}>
            <button className={styles.confirmBtn} onClick={handleConfirm}>
              Confirm: <strong>{selectedPath[selectedPath.length - 1]}</strong>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
