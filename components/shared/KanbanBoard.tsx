'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface KanbanColumn {
  id: string
  label: string
  color?: string
}

export interface KanbanCard {
  id: string
  columnId: string
  content: React.ReactNode
  dragData?: Record<string, unknown>
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  cards: KanbanCard[]
  onCardMove: (cardId: string, newColumnId: string) => Promise<void> | void
  renderCard?: (card: KanbanCard, isDragging?: boolean) => React.ReactNode
}

function SortableCard({
  card,
  renderCard,
}: {
  card: KanbanCard
  renderCard?: (card: KanbanCard, isDragging?: boolean) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { columnId: card.columnId } })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderCard ? renderCard(card, isDragging) : card.content}
    </div>
  )
}

function DroppableColumn({
  col,
  colCards,
  renderCard,
}: {
  col: KanbanColumn
  colCards: KanbanCard[]
  renderCard?: (card: KanbanCard, isDragging?: boolean) => React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <SortableContext
      items={colCards.map(c => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        id={col.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minHeight: '80px',
          borderRadius: 'var(--radius-control)',
          padding: colCards.length === 0 ? '12px' : '0',
          border: colCards.length === 0
            ? `1.5px dashed ${isOver ? 'var(--color-primary)' : 'var(--color-border)'}`
            : 'none',
          backgroundColor: isOver ? 'var(--color-surface-muted)' : 'transparent',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
        }}
      >
        {colCards.length === 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            No items
          </p>
        )}
        {colCards.map(card => (
          <SortableCard key={card.id} card={card} renderCard={renderCard} />
        ))}
      </div>
    </SortableContext>
  )
}

export function KanbanBoard({ columns, cards, onCardMove, renderCard }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)
  const [optimisticCards, setOptimisticCards] = useState(cards)

  // Keep in sync with external cards
  if (cards !== optimisticCards && !activeCard) {
    setOptimisticCards(cards)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const card = optimisticCards.find(c => c.id === event.active.id)
    setActiveCard(card ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const cardId = active.id as string
    const overId = over.id as string

    // Determine target column
    const overIsColumn = columns.some(c => c.id === overId)
    const overCard = optimisticCards.find(c => c.id === overId)
    const targetColumnId = overIsColumn ? overId : overCard?.columnId

    if (!targetColumnId) return

    const movingCard = optimisticCards.find(c => c.id === cardId)
    if (!movingCard || movingCard.columnId === targetColumnId) return

    const snapshotBeforeMove = optimisticCards

    // Optimistic update
    setOptimisticCards(prev =>
      prev.map(c => c.id === cardId ? { ...c, columnId: targetColumnId } : c)
    )

    try {
      await onCardMove(cardId, targetColumnId)
    } catch {
      setOptimisticCards(snapshotBeforeMove)
    }
  }

  const columnWidthStyle: React.CSSProperties = {
    minWidth: '260px',
    maxWidth: '320px',
    flex: '1 1 280px',
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          alignItems: 'flex-start',
        }}
      >
        {columns.map(col => {
          const colCards = optimisticCards.filter(c => c.columnId === col.id)
          return (
            <div key={col.id} style={columnWidthStyle}>
              {/* Column header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {col.color && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: col.color,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', flex: 1 }}>
                  {col.label}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: '999px',
                    padding: '1px 7px',
                  }}
                >
                  {colCards.length}
                </span>
              </div>

              {/* Cards drop zone */}
              <DroppableColumn col={col} colCards={colCards} renderCard={renderCard} />
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeCard && (
          <div style={{ opacity: 0.9, cursor: 'grabbing' }}>
            {renderCard ? renderCard(activeCard, true) : activeCard.content}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
