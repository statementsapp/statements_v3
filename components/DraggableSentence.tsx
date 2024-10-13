import React, { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { Sentence } from '../types/documentTypes'
import SentenceComponent from './SentenceComponent'

type DragItem = {
  type: 'SENTENCE'
  id: string
  paragraphId: string
  index: number
}

interface DraggableSentenceProps {
  sentence: Sentence
  paragraphId: string
  index: number
  moveSentence: (draggedSentenceId: string, sourceParagraphId: string, targetParagraphId: string, targetIndex: number) => void
  onClick: (e: React.MouseEvent) => void
  isEditing: boolean
  onInput: (text: string) => void
  onSubmit: (text: string) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onRemarkMouseEnter: (sentenceId: string) => void
  onRemarkMouseLeave: () => void
  onRemarkClick: (sentenceId: string) => void
}

const DraggableSentence: React.FC<DraggableSentenceProps> = ({
  sentence,
  paragraphId,
  index,
  moveSentence,
  onClick,
  isEditing,
  onInput,
  onSubmit,
  onMouseEnter,
  onMouseLeave,
  onRemarkMouseEnter,
  onRemarkMouseLeave,
  onRemarkClick
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [{ isDragging }, drag] = useDrag({
    type: 'SENTENCE',
    item: { type: 'SENTENCE', id: sentence.id, paragraphId, index } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'SENTENCE',
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      const sourceParagraphId = item.paragraphId
      const targetParagraphId = paragraphId

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceParagraphId === targetParagraphId) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveSentence(item.id, sourceParagraphId, targetParagraphId, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
      item.paragraphId = targetParagraphId
    },
  })

  drag(drop(ref))

  return (
    <span ref={ref} className={`inline ${isDragging ? 'opacity-50' : ''}`}>
      <SentenceComponent
        sentence={sentence}
        onClick={onClick}
        isEditing={isEditing}
        onInput={onInput}
        onSubmit={onSubmit}
        isDragging={isDragging}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onSentenceClick={onClick}
        onRemarkClick={onRemarkClick}
        onRemarkMouseEnter={onRemarkMouseEnter}
        onRemarkMouseLeave={onRemarkMouseLeave}
      />
    </span>
  )
}

export default DraggableSentence
