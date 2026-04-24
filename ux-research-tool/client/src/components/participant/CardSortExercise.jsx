import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import api from '../../api/client';
import styles from './CardSortExercise.module.css';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DraggableCard({ card, isDimmed }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        styles.card,
        isDragging ? styles.cardDragging : '',
        isDimmed ? styles.cardDimmed : '',
      ].join(' ')}
      {...listeners}
      {...attributes}
    >
      {card.label}
    </div>
  );
}

function DroppableCategory({ category, cards }) {
  const { setNodeRef, isOver } = useDroppable({ id: category.id });

  return (
    <div
      ref={setNodeRef}
      className={[styles.category, isOver ? styles.categoryOver : ''].join(' ')}
    >
      <p className={styles.categoryName}>{category.label}</p>
      <div className={styles.categoryCards}>
        {cards.length === 0 && (
          <p className={styles.categoryEmpty}>Drop cards here</p>
        )}
        {cards.map(card => (
          <div key={card.id} className={styles.placedCard}>
            {card.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CardSortExercise({ study, token, participant }) {
  const navigate = useNavigate();

  const shuffledCards = useMemo(
    () => shuffle(study.config.cards),
    []
  );

  // placements: card_id → category_id | null
  const [placements, setPlacements] = useState(
    () => Object.fromEntries(shuffledCards.map(c => [c.id, null]))
  );
  const [activeCard, setActiveCard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const allPlaced = shuffledCards.every(c => placements[c.id] !== null);

  const unplacedCards = shuffledCards.filter(c => placements[c.id] === null);

  function cardsInCategory(categoryId) {
    return shuffledCards.filter(c => placements[c.id] === categoryId);
  }

  function handleDragStart(event) {
    const card = shuffledCards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const categoryId = study.config.categories.find(cat => cat.id === over.id)?.id;
    if (!categoryId) return;

    setPlacements(prev => ({ ...prev, [active.id]: categoryId }));
  }

  async function handleSubmit() {
    if (!allPlaced) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/public/${token}/respond`, {
        participant_name:  participant.name,
        participant_email: participant.email,
        data: {
          placements: shuffledCards.map(c => ({
            card_id:     c.id,
            category_id: placements[c.id],
          })),
        },
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
    return (
      <div className={styles.loadingPage}>
        <p className={styles.muted}>Submitting your response…</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.page}>
        <div className={styles.layout}>
          {/* Left: unsorted cards */}
          <div className={styles.sidebar}>
            <p className={styles.sidebarHeading}>Cards to sort</p>
            <div className={styles.cardList}>
              {unplacedCards.length === 0 ? (
                <p className={styles.allPlaced}>All cards placed</p>
              ) : (
                unplacedCards.map(card => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    isDimmed={activeCard?.id === card.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: category columns */}
          <div className={styles.categories}>
            {study.config.categories.map(cat => (
              <DroppableCategory
                key={cat.id}
                category={cat}
                cards={cardsInCategory(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {submitError && <p className={styles.footerError}>{submitError}</p>}
          <div className={styles.footerInner}>
            <p className={styles.footerCount}>
              {unplacedCards.length === 0
                ? 'All cards sorted — ready to submit.'
                : `${unplacedCards.length} card${unplacedCards.length === 1 ? '' : 's'} left to place`}
            </p>
            <button
              className={styles.submitBtn}
              disabled={!allPlaced}
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div className={`${styles.card} ${styles.cardOverlay}`}>
            {activeCard.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
