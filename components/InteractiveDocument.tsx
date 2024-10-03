'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { generateRandomSentence } from '../utils/sentenceGenerator' // You'll need to create this utility function

type Sentence = {
  id: string
  text: string
  remarks: string[]
  remarkColor?: string
}

type Paragraph = {
  id: string
  sentences: Sentence[]
}

// Add this custom hook at the top of the file, outside of any component
function useDebounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  const timeout = useRef<NodeJS.Timeout>()

  return useCallback((...args: Parameters<T>) => {
    const later = () => {
      clearTimeout(timeout.current)
      func(...args)
    }

    clearTimeout(timeout.current)
    timeout.current = setTimeout(later, wait)
  }, [func, wait]) as T
}

// Add this new type
type DragItem = {
  type: 'SENTENCE'
  id: string
  paragraphId: string
  index: number
}

const CursorSpace = React.forwardRef<HTMLSpanElement, {
  id: string
  onEnter: (text: string) => void
  onFocus: () => void
  isFocused: boolean
  isFirst: boolean
  isLast: boolean
  showSolidCursor: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  isSeparator?: boolean
  isDisabled: boolean
  remarks?: string[]
  remarkColor?: string
  isRemarkCursor?: boolean
  isRemarkExpanded?: boolean
  isRemarkHovered?: boolean
  isRemarkEditing?: boolean
}>(({ id, onEnter, onFocus, isFocused, isFirst, isLast, showSolidCursor, onMouseEnter, onMouseLeave, onClick, isSeparator, isDisabled, remarks = [], remarkColor, isRemarkCursor, isRemarkExpanded, isRemarkHovered, isRemarkEditing }, ref) => {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      if (inputRef.current.firstChild) {
        range.setStart(inputRef.current.firstChild, 0)
      } else {
        range.setStart(inputRef.current, 0)
      }
      range.collapse(true)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isFocused])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && text.trim() !== '') {
      e.preventDefault()
      onEnter(text)
      setText('')
      if (inputRef.current) {
        inputRef.current.textContent = ''
      }
    }
  }

  const handleMouseEnter = () => {
    if (!isDisabled && onMouseEnter) {
      onMouseEnter()
    }
  }

  const handleMouseLeave = () => {
    if (!isDisabled && onMouseLeave) {
      onMouseLeave()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    }
  }

  return (
    <span 
      id={id}
      className={`inline ${isFirst ? '' : 'ml-[0.2em]'} ${isLast ? 'mr-0' : ''} ${isSeparator ? 'w-full' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {!isSeparator && !isFirst && remarks.length > 0 && (
        <span className={`inline ${isRemarkCursor ? 'mx-[0.4em]' : ''}`}>
          {isRemarkCursor && isRemarkExpanded && (
            <span
              ref={(node) => {
                if (node) {
                  inputRef.current = node
                  if (typeof ref === 'function') {
                    ref(node)
                  } else if (ref) {
                    ref.current = node
                  }
                }
              }}
              contentEditable
              suppressContentEditableWarning
              className={`inline-block min-w-[1ch] outline-none ${
                isFocused ? 'bg-transparent' : ''
              } mr-[0.3em]`}
              onInput={(e) => setText(e.currentTarget.textContent || '')}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              style={{ verticalAlign: 'baseline' }}
            >
              {showSolidCursor && !isFocused && !text && '|'}
            </span>
          )}
          <span 
            className={`inline transition-all duration-300 ease-in-out ${
              isRemarkExpanded && isRemarkHovered && !isRemarkEditing ? 'bg-gray-100' : ''
            }`}
          >
            {isRemarkExpanded ? (
              <span 
                className={`text-gray-600 ${isRemarkEditing ? 'opacity-70' : ''} inline`}
                style={{
                  textDecoration: 'underline',
                  textDecorationColor: remarkColor,
                  textUnderlineOffset: '3px',
                  verticalAlign: 'baseline',
                }}
              >
                {remarks[remarks.length - 1]}
              </span>
            ) : (
              <span 
                className="text-gray-500 inline-block"
                style={{
                  fontSize: '0.8em',
                  lineHeight: '1',
                  verticalAlign: 'super',
                  position: 'relative',
                  top: '-0.1em',
                  marginLeft: '-0.05em',
                }}
              >
                ⊕
              </span>
            )}
          </span>
        </span>
      )}
      {!isRemarkCursor && (
        <span
          ref={(node) => {
            if (node) {
              inputRef.current = node
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }
          }}
          contentEditable
          suppressContentEditableWarning
          className={`inline-block min-w-[1ch] outline-none ${
            isFocused ? 'bg-transparent' : ''
          } ${isSeparator ? 'w-full' : ''}`}
          onInput={(e) => setText(e.currentTarget.textContent || '')}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
        >
          {showSolidCursor && !isFocused && !text && '|'}
        </span>
      )}
    </span>
  )
})

CursorSpace.displayName = 'CursorSpace'

const SentenceComponent: React.FC<{
  sentence: Sentence
  onClick: (e: React.MouseEvent) => void
  isEditing: boolean
  onInput: (text: string) => void
  isDragging: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}> = ({ sentence, onClick, isEditing, onInput, isDragging, onMouseEnter, onMouseLeave }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [localText, setLocalText] = useState(sentence.text)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)

  useEffect(() => {
    setLocalText(sentence.text)
  }, [sentence.text])

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      if (sel) {
        range.setStart(ref.current.firstChild || ref.current, selectionStart)
        range.setEnd(ref.current.firstChild || ref.current, selectionEnd)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }, [isEditing, selectionStart, selectionEnd])

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      onClick(e)
    } else {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        setSelectionStart(range.startOffset)
        setSelectionEnd(range.endOffset)
      }
    }
  }

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const newText = e.currentTarget.textContent || ''
    setLocalText(newText)
    onInput(newText)

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      setSelectionStart(range.startOffset)
      setSelectionEnd(range.endOffset)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  return (
    <span
      ref={ref}
      className={`cursor-pointer inline ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleClick}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      dangerouslySetInnerHTML={{ __html: localText }}
    />
  )
}

const DraggableSentence: React.FC<{
  sentence: Sentence
  paragraphId: string
  index: number
  moveSentence: (draggedSentenceId: string, sourceParagraphId: string, targetParagraphId: string, targetIndex: number) => void
  onClick: (e: React.MouseEvent) => void
  isEditing: boolean
  onInput: (text: string) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}> = ({ sentence, paragraphId, index, moveSentence, onClick, isEditing, onInput, onMouseEnter, onMouseLeave }) => {
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
        isDragging={isDragging}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </span>
  )
}

const ParagraphSeparator: React.FC<{
  id: string
  onEnter: (text: string) => void
  onFocus: () => void
  isFocused: boolean
  isLast: boolean
  isDisabled?: boolean
}> = React.memo(({ id, onEnter, onFocus, isFocused, isLast, isDisabled }) => {
  const [isHovered, setIsHovered] = useState(false)
  const separatorRef = useRef<HTMLDivElement>(null)
  const cursorSpaceRef = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = () => {
    if (!isFocused) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isFocused) {
      setIsHovered(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onFocus()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (separatorRef.current && !separatorRef.current.contains(event.target as Node)) {
        // This will collapse the separator and remove the hover state when clicking outside
        setIsHovered(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Reset hover state when focus is lost
  useEffect(() => {
    if (!isFocused) {
      setIsHovered(false)
    }
  }, [isFocused])

  return (
    <div 
      ref={separatorRef}
      className={`w-full relative flex items-center cursor-text transition-all duration-300 ease-in-out ${
        isFocused ? 'h-8 mt-[1px] mb-[1px]' : 'h-1 my-[1px]'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {!isFocused && (
        <div 
          className={`absolute left-0 w-1/3 h-1 bg-gray-300 transition-opacity duration-300 ease-in-out ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} 
        />
      )}
      <CursorSpace
        id={id}
        onEnter={onEnter}
        onFocus={onFocus}
        isFocused={isFocused}
        isFirst={true}
        isLast={isLast}
        showSolidCursor={false}
        isSeparator={true}
        ref={cursorSpaceRef}
        isDisabled={isDisabled ?? false}
      />
    </div>
  )
})

ParagraphSeparator.displayName = 'ParagraphSeparator'

// Removed 'isFirst' from ParagraphComponent props
const ParagraphComponent: React.FC<{
  paragraph: Paragraph
  updateParagraph: (updatedParagraph: Paragraph) => void
  editingSentenceId: string | null
  setEditingSentenceId: (id: string | null) => void
  focusedCursorSpaceId: string | null
  setFocusedCursorSpaceId: (id: string | null) => void
  isLast: boolean
  addParagraph: (index: number, text: string) => void
  paragraphIndex: number
  setFocusParagraphId: (id: string | null) => void
  moveSentence: (sentenceId: string, sourceParagraphId: string, targetParagraphId: string, targetIndex: number) => void
  newlyPlacedSentenceId: string | null
}> = ({ 
  paragraph, 
  updateParagraph, 
  editingSentenceId, 
  setEditingSentenceId, 
  focusedCursorSpaceId, 
  setFocusedCursorSpaceId,
  isLast,
  addParagraph,
  paragraphIndex,
  setFocusParagraphId,
  moveSentence,
  newlyPlacedSentenceId
}) => {
  const [lastClickedSentenceId, setLastClickedSentenceId] = useState<string | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null)
  const [isFirstCursorSpaceHovered, setIsFirstCursorSpaceHovered] = useState(false)
  const [isEndingSpaceHovered, setIsEndingSpaceHovered] = useState(false)
  const [expandedRemarkIndex, setExpandedRemarkIndex] = useState<number | null>(null)
  const [showRemarkSolidCursor, setShowRemarkSolidCursor] = useState(false)
  const [keepRemarkExpanded, setKeepRemarkExpanded] = useState(false)
  const [mouseHasMoved, setMouseHasMoved] = useState(true)
  const lastExpandedRemarkRef = useRef<number | null>(null)
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hoveredRemarkIndex, setHoveredRemarkIndex] = useState<number | null>(null)
  const [editingRemarkIndex, setEditingRemarkIndex] = useState<number | null>(null)

  // Add refs for managing hover delays
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Added throttle reference to track the last execution time
  const lastSeparatorEnterRef = useRef<number>(0)

  const handleLastCursorMouseEnter = () => {
    // Clear any existing leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    // Set a timeout to set the hover state after 200ms
    enterTimeoutRef.current = setTimeout(() => {
      setIsEndingSpaceHovered(true)
      enterTimeoutRef.current = null
    }, 300)
  }

  const handleLastCursorMouseLeave = () => {
    // Clear any existing enter timeout
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
      enterTimeoutRef.current = null
    }
    // Set a timeout to unset the hover state after 200ms
    leaveTimeoutRef.current = setTimeout(() => {
      setIsEndingSpaceHovered(false)
      leaveTimeoutRef.current = null
    }, 200)
  }

  useEffect(() => {
    // Cleanup timeouts on unmount
    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current)
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [])

  const handleSentenceClick = (sentenceId: string, index: number, e: React.MouseEvent) => {
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - lastClickTime
    const cursorSpaceId = `${paragraph.id}-${index}`
    
    if (lastClickedSentenceId === sentenceId && timeDiff < 300) {
      setEditingSentenceId(sentenceId)
      setFocusedCursorSpaceId(null)
    } else {
      setEditingSentenceId(sentenceId)
      setFocusedCursorSpaceId(cursorSpaceId)
    }

    setLastClickedSentenceId(sentenceId)
    setLastClickTime(currentTime)
    moveSentence(sentenceId, paragraph.id, paragraph.id, index)
  }

  const handleSentenceInput = (sentenceId: string, text: string) => {
    const newSentences = paragraph.sentences.map((s) =>
      s.id === sentenceId ? { ...s, text } : s
    )
    updateParagraph({ ...paragraph, sentences: newSentences })
  }

  const handleCursorSpaceEnter = (text: string, index: number) => {
    const newSentences = [...paragraph.sentences]
    const newSentenceId = Date.now().toString()
    const newSentence = { id: newSentenceId, text, remarks: [], remarkColor: undefined }
    
    if (index > 0 && newSentences[index - 1].remarks.length > 0) {
      // If the new sentence is created from a remark cursor space, remove the remark
      newSentences[index - 1] = { ...newSentences[index - 1], remarks: [] }
    }
    
    newSentences.splice(index, 0, newSentence)
    updateParagraph({ ...paragraph, sentences: newSentences })
    setFocusedCursorSpaceId(`${paragraph.id}-${index}`)
    setExpandedRemarkIndex(null)
    setShowRemarkSolidCursor(false)
    setMouseHasMoved(false) // Disable mouseovers until mouse moves
  }

  const moveSentenceWithinParagraph = (dragIndex: number, hoverIndex: number) => {
    const newSentences = [...paragraph.sentences]
    const [removed] = newSentences.splice(dragIndex, 1)
    newSentences.splice(hoverIndex, 0, removed)
    updateParagraph({ ...paragraph, sentences: newSentences })
  }

  const handleSeparatorEnter = (text: string, position: 'before' | 'after') => {
    const now = Date.now()
    if (now - lastSeparatorEnterRef.current < 500) {
      return
    }
    lastSeparatorEnterRef.current = now
    const index = position === 'before' ? paragraphIndex : paragraphIndex + 1
    const newParagraphId = addParagraph(index, text)
    console.log('3. New paragraph added with ID:', newParagraphId) // Log 3
    setFocusParagraphId(newParagraphId)
    console.log('Setting focused cursor space ID to:', 'separator-enter')
    setFocusedCursorSpaceId('separator-enter')
  }

  const handleParagraphClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    if (e.target === e.currentTarget) {
      const lastCursorSpaceId = `${paragraph.id}-${paragraph.sentences.length - 1}`
      setFocusedCursorSpaceId(lastCursorSpaceId)
      // Force focus on the last CursorSpace
      const lastCursorSpace = document.getElementById(lastCursorSpaceId)
      if (lastCursorSpace) {
        const contentEditableSpan = lastCursorSpace.querySelector('span[contenteditable]')
        if (contentEditableSpan) {
          (contentEditableSpan as HTMLElement).focus()
        }
      }
    }
  }

  const handleParagraphMouseMove = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const { clientX, currentTarget } = e
    const { right, width } = currentTarget.getBoundingClientRect()
    const isHoveringEndingSpace = right - clientX < width * 0.1 // Adjust this value as needed
    setIsEndingSpaceHovered(isHoveringEndingSpace)
  }

  const handleParagraphMouseLeave = () => {
    setIsEndingSpaceHovered(false)
  }

  const handleRemarkMouseEnter = (index: number) => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current)
      collapseTimeoutRef.current = null
    }
    setExpandedRemarkIndex(index)
    setHoveredSentenceIndex(index)
    setHoveredRemarkIndex(index)
    setShowRemarkSolidCursor(true)
    setKeepRemarkExpanded(true)
    lastExpandedRemarkRef.current = index
  }

  const handleRemarkMouseLeave = () => {
    setShowRemarkSolidCursor(false)
    setHoveredRemarkIndex(null)
    if (!keepRemarkExpanded) {
      collapseTimeoutRef.current = setTimeout(() => {
        setExpandedRemarkIndex(null)
        setHoveredSentenceIndex(null)
        lastExpandedRemarkRef.current = null
      }, 500)
    }
  }

  const handleRemarkClick = (index: number) => {
    setShowRemarkSolidCursor(false)
    setFocusedCursorSpaceId(`${paragraph.id}-${index}-remark`)
    setKeepRemarkExpanded(true)
    setEditingRemarkIndex(index)
  }

  const handleDocumentClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    const isRemarkClick = target.closest('.remark-container') !== null
    
    if (!isRemarkClick) {
      setKeepRemarkExpanded(false)
      setEditingRemarkIndex(null)
      collapseTimeoutRef.current = setTimeout(() => {
        setExpandedRemarkIndex(null)
        setHoveredSentenceIndex(null)
        lastExpandedRemarkRef.current = null
      }, 500)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [handleDocumentClick])

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = () => {
      if (!mouseHasMoved) {
        setMouseHasMoved(true)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mouseHasMoved])

  return (
    <>
      <p 
        className="document-paragraph"
        onClick={handleParagraphClick}
        onMouseMove={handleParagraphMouseMove}
        onMouseLeave={handleParagraphMouseLeave}
      >
        <CursorSpace
          id={`${paragraph.id}-start`}
          onEnter={(text) => handleCursorSpaceEnter(text, 0)}
          onFocus={() => setFocusedCursorSpaceId(`${paragraph.id}-start`)}
          isFocused={focusedCursorSpaceId === `${paragraph.id}-start`}
          isFirst={true}
          isLast={paragraph.sentences.length === 0}
          showSolidCursor={isFirstCursorSpaceHovered}
          onMouseEnter={() => setIsFirstCursorSpaceHovered(true)}
          onMouseLeave={() => setIsFirstCursorSpaceHovered(false)}
          isDisabled={newlyPlacedSentenceId !== null}
        />
        {paragraph.sentences.map((sentence, index) => (
          <React.Fragment key={sentence.id}>
            <DraggableSentence
              sentence={sentence}
              paragraphId={paragraph.id}
              index={index}
              moveSentence={moveSentence}
              onClick={(e) => handleSentenceClick(sentence.id, index, e)}
              isEditing={editingSentenceId === sentence.id}
              onInput={(text) => handleSentenceInput(sentence.id, text)}
              onMouseEnter={() => mouseHasMoved && setHoveredSentenceIndex(index)}
              onMouseLeave={() => mouseHasMoved && setHoveredSentenceIndex(null)}
            />
            <span className="remark-container">
              <CursorSpace
                id={`${paragraph.id}-${index}-remark`}
                onEnter={(text) => handleCursorSpaceEnter(text, index + 1)}
                onFocus={() => setFocusedCursorSpaceId(`${paragraph.id}-${index}-remark`)}
                isFocused={focusedCursorSpaceId === `${paragraph.id}-${index}-remark`}
                isFirst={false}
                isLast={false}
                showSolidCursor={mouseHasMoved && expandedRemarkIndex === index && showRemarkSolidCursor}
                onMouseEnter={() => mouseHasMoved && handleRemarkMouseEnter(index)}
                onMouseLeave={handleRemarkMouseLeave}
                onClick={() => handleRemarkClick(index)}
                isDisabled={newlyPlacedSentenceId !== null}
                remarks={sentence.remarks}
                remarkColor={sentence.remarkColor}
                isRemarkCursor={true}
                isRemarkExpanded={expandedRemarkIndex === index}
                isRemarkHovered={hoveredRemarkIndex === index}
                isRemarkEditing={editingRemarkIndex === index}
              />
            </span>
            <CursorSpace
              id={`${paragraph.id}-${index}`}
              onEnter={(text) => handleCursorSpaceEnter(text, index + 1)}
              onFocus={() => setFocusedCursorSpaceId(`${paragraph.id}-${index}`)}
              isFocused={focusedCursorSpaceId === `${paragraph.id}-${index}`}
              isFirst={false}
              isLast={index === paragraph.sentences.length - 1}
              showSolidCursor={
                mouseHasMoved && (
                  (hoveredSentenceIndex === index && expandedRemarkIndex !== index) || 
                  (isEndingSpaceHovered && index === paragraph.sentences.length - 1)
                )
              }
              onMouseEnter={() => {
                if (mouseHasMoved) {
                  if (index === paragraph.sentences.length - 1) {
                    handleLastCursorMouseEnter()
                  } else {
                    setHoveredSentenceIndex(index)
                  }
                }
              }}
              onMouseLeave={() => {
                if (mouseHasMoved) {
                  if (index === paragraph.sentences.length - 1) {
                    handleLastCursorMouseLeave()
                  } else {
                    setHoveredSentenceIndex(null)
                  }
                }
              }}
              isDisabled={newlyPlacedSentenceId !== null}
            />
            {/* Add a space after each sentence except the last one */}
            {index < paragraph.sentences.length - 1 && ' '}
          </React.Fragment>
        ))}
        {isEndingSpaceHovered && (
          <span 
            className="absolute right-0 top-0 bottom-0 w-1 bg-white"
            style={{ cursor: 'text' }}
          />
        )}
      </p>
      <ParagraphSeparator
        id={`separator-after-${paragraph.id}`}
        onEnter={(text) => handleSeparatorEnter(text, 'after')}
        onFocus={() => setFocusedCursorSpaceId(`separator-after-${paragraph.id}`)}
        isFocused={focusedCursorSpaceId === `separator-after-${paragraph.id}`}
        isLast={isLast}
        isDisabled={newlyPlacedSentenceId !== null}
      />
    </>
  )
}

const InteractiveDocument: React.FC = () => {
  const [title, setTitle] = useState('Document Title')
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([
    {
      id: '1',
      sentences: [
        { id: '1', text: 'This is the first sentence of the first paragraph.', remarks: [], remarkColor: undefined },
        { id: '2', text: 'Here is the second sentence.', remarks: [], remarkColor: undefined },
        { id: '3', text: 'The third sentence follows.', remarks: [], remarkColor: undefined },
        { id: '4', text: 'This is the fourth and final sentence of the first paragraph.', remarks: [], remarkColor: undefined },
      ],
    },
    {
      id: '2',
      sentences: [
        { id: '5', text: 'The second paragraph begins with this sentence.', remarks: [], remarkColor: undefined },
        { id: '6', text: 'Here is the second sentence of the second paragraph.', remarks: [], remarkColor: undefined },
        { id: '7', text: 'The third sentence continues the thought.', remarks: [], remarkColor: undefined },
        { id: '8', text: 'This final sentence concludes the second paragraph.', remarks: [], remarkColor: undefined },
      ],
    },
    {
      id: '3',
      sentences: [
        { id: '9', text: 'The third paragraph begins with this sentence.', remarks: [], remarkColor: undefined },
        { id: '10', text: 'Look at this sentence', remarks: [], remarkColor: undefined },
        { id: '11', text: 'The third sentence continues the thought.', remarks: [], remarkColor: undefined },
        { id: '12', text: 'So much sentence and this is the final sentence of this paragraph.', remarks: [], remarkColor: undefined },
      ],
    },
  ])
  const [editingSentenceId, setEditingSentenceId] = useState<string | null>(null)
  const [focusedCursorSpaceId, setFocusedCursorSpaceId] = useState<string | null>(null)
  const [focusParagraphId, setFocusParagraphId] = useState<string | null>(null)
  const [newlyPlacedSentence, setNewlyPlacedSentence] = useState<{ id: string, initialX: number, initialY: number } | null>(null)
  const mouseMoveThreshold = 30
  const [thresholdReached, setThresholdReached] = useState(false)
  const [remarks, setRemarks] = useState<{ [key: string]: string[] }>({})

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (newlyPlacedSentence) {
      const { initialX, initialY } = newlyPlacedSentence
      const dx = e.clientX - initialX
      const dy = e.clientY - initialY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance >= mouseMoveThreshold) {
        setNewlyPlacedSentence(null)
        setThresholdReached(true)
        console.log('Mouse movement threshold reached. Expansions and solid cursors are now active.')
      }
    }
  }, [newlyPlacedSentence, mouseMoveThreshold])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  const addRemark = useCallback((sentenceId: string) => {
    const newRemark = generateRandomSentence()
    const pastelColor = `hsl(${Math.random() * 360}, 100%, 80%)`
    
    setParagraphs((prevParagraphs) => {
      return prevParagraphs.map(paragraph => ({
        ...paragraph,
        sentences: paragraph.sentences.map(sentence => 
          sentence.id === sentenceId
            ? { ...sentence, remarks: [...(sentence.remarks || []), newRemark], remarkColor: pastelColor }
            : sentence
        )
      }))
    })
  }, [])

  const updateParagraph = (updatedParagraph: Paragraph) => {
    setParagraphs((prevParagraphs) => {
      const newParagraphs = prevParagraphs.map((p) => (p.id === updatedParagraph.id ? updatedParagraph : p))
      
      const oldParagraph = prevParagraphs.find(p => p.id === updatedParagraph.id)
      const newSentence = updatedParagraph.sentences.find(s => !oldParagraph?.sentences.some(os => os.id === s.id))
      
      if (newSentence) {
        setNewlyPlacedSentence({
          id: newSentence.id,
          initialX: window.innerWidth / 2,
          initialY: window.innerHeight / 2
        })
        setThresholdReached(false)

        // Set a timeout to add a remark after 5 seconds
        setTimeout(() => addRemark(newSentence.id), 5000)
      }
      
      return newParagraphs
    })
  }

  const addParagraph = (index: number, text: string): string => {
    const newParagraphId = Date.now().toString()
    const newParagraph: Paragraph = {
      id: newParagraphId,
      sentences: [{ id: `${newParagraphId}-1`, text, remarks: [], remarkColor: undefined }],
    }
    setParagraphs((prevParagraphs) => {
      const newParagraphs = [...prevParagraphs]
      newParagraphs.splice(index, 0, newParagraph)
      return newParagraphs
    })
    return newParagraphId  // Explicitly return the new paragraph ID
  }

  useEffect(() => {
    if (focusParagraphId) {
      console.log('4. Effect triggered. focusParagraphId:', focusParagraphId)
      const paragraphIndex = paragraphs.findIndex(p => p.id === focusParagraphId)
      if (paragraphIndex !== -1) {
        const paragraph = paragraphs[paragraphIndex]
        if (paragraph && paragraph.sentences.length > 0) {
          if (focusedCursorSpaceId === 'separator-enter') {
            // Function to find the correct cursor space
            const findCorrectCursorSpace = (index: number): string => {
              console.log('Finding correct cursor space for index:', index)
              const p = paragraphs[index]
              if (p && p.sentences.length > 0) {
                return `${p.id}-${p.sentences.length - 1}`
              }
              // If the paragraph is empty, return its start cursor space
              return `${p.id}-start`
            }

            // Find the correct cursor space for the newly added paragraph
            const correctCursorSpace = findCorrectCursorSpace(paragraphIndex)
            console.log('5. Correct cursor space:', correctCursorSpace)
            setFocusedCursorSpaceId(correctCursorSpace)
          } else {
            // For other cases, keep the existing behavior
            console.log('Setting focused cursor space ID to:', `${paragraph.id}-0`)
            setFocusedCursorSpaceId(`${paragraph.id}-0`)
          }
        }
      }
      setFocusParagraphId(null)
    }
  }, [paragraphs, focusParagraphId, focusedCursorSpaceId])

  const moveSentence = useCallback((sentenceId: string, sourceParagraphId: string, targetParagraphId: string, targetIndex: number) => {
    setParagraphs((prevParagraphs) => {
      const newParagraphs = [...prevParagraphs]
      
      // Find the source and target paragraphs
      const sourceParagraphIndex = newParagraphs.findIndex(p => p.id === sourceParagraphId)
      const targetParagraphIndex = newParagraphs.findIndex(p => p.id === targetParagraphId)
      
      if (sourceParagraphIndex === -1 || targetParagraphIndex === -1) {
        return prevParagraphs
      }

      // Remove the sentence from the source paragraph
      const sourceParagraph = newParagraphs[sourceParagraphIndex]
      const sentenceIndex = sourceParagraph.sentences.findIndex(s => s.id === sentenceId)
      if (sentenceIndex === -1) {
        return prevParagraphs
      }
      const [movedSentence] = sourceParagraph.sentences.splice(sentenceIndex, 1)

      // Insert the sentence into the target paragraph
      const targetParagraph = newParagraphs[targetParagraphIndex]
      targetParagraph.sentences.splice(targetIndex, 0, movedSentence)

      // If the source paragraph is now empty, remove it
      if (sourceParagraph.sentences.length === 0) {
        newParagraphs.splice(sourceParagraphIndex, 1)
      }

      return newParagraphs
    })
  }, [])

  // Add this new function to reset newlyPlacedSentence
  const resetNewlyPlacedSentence = useCallback(() => {
    setNewlyPlacedSentence(null)
    setThresholdReached(false)
  }, [])

  // Add a new useEffect to reset newlyPlacedSentence after a delay
  useEffect(() => {
    if (newlyPlacedSentence) {
      const timer = setTimeout(() => {
        resetNewlyPlacedSentence()
      }, 500) // Adjust this delay as needed

      return () => clearTimeout(timer)
    }
  }, [newlyPlacedSentence, resetNewlyPlacedSentence])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="document-container">
        <div className="document-content">
          <h1
            className="text-3xl font-bold mb-4"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setTitle(e.currentTarget.textContent || '')}
          >
            {title}
          </h1>

          <ParagraphSeparator
            id={`separator-before-first`}
            onEnter={(text) => {
              const newParagraphId = addParagraph(0, text)
              // Set focus to the new paragraph's last cursor space
              setFocusedCursorSpaceId(`${newParagraphId}-0`)
              // Use setFocusParagraphId to trigger the useEffect that will handle the focus
              setFocusParagraphId(newParagraphId)
            }}
            onFocus={() => setFocusedCursorSpaceId(`separator-before-first`)}
            isFocused={focusedCursorSpaceId === `separator-before-first`}
            isLast={false}
            isDisabled={newlyPlacedSentence !== null}
          />

          {paragraphs.map((paragraph, index) => (
            <ParagraphComponent
              key={paragraph.id}
              paragraph={paragraph}
              updateParagraph={updateParagraph}
              editingSentenceId={editingSentenceId}
              setEditingSentenceId={setEditingSentenceId}
              focusedCursorSpaceId={focusedCursorSpaceId}
              setFocusedCursorSpaceId={setFocusedCursorSpaceId}
              isLast={index === paragraphs.length - 1}
              addParagraph={addParagraph}
              paragraphIndex={index}
              setFocusParagraphId={setFocusParagraphId}
              moveSentence={moveSentence}
              newlyPlacedSentenceId={newlyPlacedSentence?.id ?? null}
            />
          ))}
          {/* Removed the extra cursor space here */}
        </div>
      </div>
    </DndProvider>
  )
}

export default InteractiveDocument