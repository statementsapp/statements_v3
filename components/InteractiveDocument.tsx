'use client'

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { generateRandomSentence } from '../utils/sentenceGenerator' // You'll need to create this utility function
import { Messenger, Message, MessengerProps } from './Messenger' // Update this import

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

const CursorSpace = React.forwardRef<
  { resetContent: () => void },
  {
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
    onInput: (text: string) => void
    onReset: () => void
  }
>(({ 
  id,
  onEnter,
  onFocus,
  isFocused,
  isFirst,
  isLast,
  showSolidCursor,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isSeparator,
  isDisabled,
  remarks = [],
  remarkColor,
  isRemarkCursor,
  isRemarkExpanded,
  isRemarkHovered,
  isRemarkEditing,
  onInput,
  onReset
}, ref) => {
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

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const newText = e.currentTarget.textContent || ''
    setText(newText)
    onInput(newText)
  }

  const resetContent = () => {
    setText('')
    if (inputRef.current) {
      inputRef.current.textContent = ''
    }
    onReset()
  }

  useImperativeHandle(ref, () => ({
    resetContent
  }))

  return (
    <span 
      id={id}
      className={`inline ${isFirst ? '' : 'ml-[0.2em]'} ${isLast ? 'mr-0' : ''} ${isSeparator ? 'w-full' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {!isSeparator && !isFirst && remarks.length > 0 && (
        <span className={`inline ${isRemarkCursor ? '' : ''}`}>
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
                className="text-white inline-block" 
                style={{ verticalAlign: 'sub', fontSize: '0.8em' }}
              >
                ⊕
              </span>
            )}
          </span>
        </span>
      )}
      {!isRemarkCursor && (
        <span
          ref={inputRef}
          contentEditable
          spellCheck={false}
          suppressContentEditableWarning
          className={`inline-block min-w-[1ch] outline-none ${
            isFocused ? 'bg-transparent' : ''
          } ${isSeparator ? 'w-full' : ''}`}
          onInput={handleInput}
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
  onSubmit: (text: string) => void
  isDragging: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onSentenceClick: (e: React.MouseEvent) => void
}> = ({ sentence, onClick, isEditing, onInput, onSubmit, isDragging, onMouseEnter, onMouseLeave, onSentenceClick }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [localText, setLocalText] = useState(sentence.text)
  const [originalText, setOriginalText] = useState(sentence.text)
  const [isUserClick, setIsUserClick] = useState(false)

  useEffect(() => {
    setLocalText(sentence.text)
    setOriginalText(sentence.text)
  }, [sentence.text])

  useEffect(() => {
    if (isEditing) {
      setOriginalText(localText)
    }
  }, [isEditing])

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      if (sel) {
        range.selectNodeContents(ref.current)
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }, [isEditing])

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      onClick(e)
      onSentenceClick(e)
    }
    setIsUserClick(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (ref.current) {
        onSubmit(ref.current.textContent || '')
      }
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (isUserClick) {
      setLocalText(originalText)
      if (ref.current) {
        ref.current.textContent = originalText
      }
      onInput(originalText)
    } else {
      if (ref.current) {
        const newText = ref.current.textContent || ''
        setLocalText(newText)
        onInput(newText)
      }
    }
    setIsUserClick(false)
  }

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsUserClick(true)
      }
    }

    document.addEventListener('mousedown', handleGlobalClick)

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick)
    }
  }, [])

  return (
    <span
      ref={ref}
      className={`cursor-pointer inline ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleClick}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {localText}
    </span>
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
  onSubmit: (text: string) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}> = ({ sentence, paragraphId, index, moveSentence, onClick, isEditing, onInput, onSubmit, onMouseEnter, onMouseLeave }) => {
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
        onInput={() => {}}
        onReset={() => {}}
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
  onNewContent: (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark') => void
  handleCursorSpaceEnter: (text: string, paragraphId: string, index: number, isRemarkCursor: boolean) => void
  addRemark: (sentenceId: string) => void
  onCursorSpaceInput: (id: string, content: string) => void
  onCursorSpaceReset: (id: string) => void
  cursorSpaceRefs: React.MutableRefObject<{ [key: string]: { resetContent: () => void } }>
  onRemarkMouseEnter: (sentenceId: string) => void
  onRemarkMouseLeave: () => void
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
  newlyPlacedSentenceId,
  onNewContent,
  handleCursorSpaceEnter,
  addRemark,
  onCursorSpaceInput,
  onCursorSpaceReset,
  cursorSpaceRefs,
  onRemarkMouseEnter,
  onRemarkMouseLeave
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

    // Clear all unfocused cursor spaces
    Object.entries(cursorSpaceRefs.current).forEach(([id, ref]) => {
      if (id !== cursorSpaceId) {
        ref.resetContent()
      }
    })
  }

  const handleSentenceInput = (sentenceId: string, text: string) => {
    const newSentences = paragraph.sentences.map((s) =>
      s.id === sentenceId ? { ...s, text } : s
    )
    updateParagraph({ ...paragraph, sentences: newSentences })
    // Remove the onNewContent call from here
  }

  const handleSentenceSubmit = (sentenceId: string, text: string, index: number) => {
    const newSentences = paragraph.sentences.map((s) =>
      s.id === sentenceId ? { ...s, text } : s
    )
    updateParagraph({ ...paragraph, sentences: newSentences })
    onNewContent(text, 'user', 'sentence')
    setEditingSentenceId(null)
    setFocusedCursorSpaceId(`${paragraph.id}-${index}`)
    
    // Generate remarks for the edited sentence
    setTimeout(() => addRemark(sentenceId), 2000)
    setTimeout(() => addRemark(sentenceId), 5000)

    // Focus on the new cursor space after adding the sentence
    setTimeout(() => {
      const newCursorSpace = document.querySelector('.cursor-space:last-of-type');
      if (newCursorSpace) {
        (newCursorSpace as HTMLElement).focus();
      }
    }, 0);
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

  const handleParagraphClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Reset all cursor spaces in this paragraph
    Object.entries(cursorSpaceRefs.current).forEach(([id, ref]) => {
      if (id.startsWith(paragraph.id) && id !== focusedCursorSpaceId) {
        ref.resetContent()
      }
    })
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
    // Always expand the remark when clicked
    setShowRemarkSolidCursor(false)
    setFocusedCursorSpaceId(`${paragraph.id}-${index}-remark`)
    setKeepRemarkExpanded(true)
    setEditingRemarkIndex(index)
    setExpandedRemarkIndex(index)
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

  // Add this useEffect to focus the correct cursor space
  useEffect(() => {
    if (focusedCursorSpaceId) {
      const cursorSpace = document.getElementById(focusedCursorSpaceId)
      if (cursorSpace) {
        const contentEditableSpan = cursorSpace.querySelector('span[contenteditable]')
        if (contentEditableSpan) {
          (contentEditableSpan as HTMLElement).focus()
        }
      }
    }
  }, [focusedCursorSpaceId])

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
          onEnter={(text) => handleCursorSpaceEnter(text, paragraph.id, 0, false)}
          onFocus={() => setFocusedCursorSpaceId(`${paragraph.id}-start`)}
          isFocused={focusedCursorSpaceId === `${paragraph.id}-start`}
          isFirst={true}
          isLast={paragraph.sentences.length === 0}
          showSolidCursor={isFirstCursorSpaceHovered}
          onMouseEnter={() => setIsFirstCursorSpaceHovered(true)}
          onMouseLeave={() => setIsFirstCursorSpaceHovered(false)}
          isDisabled={newlyPlacedSentenceId !== null}
          onInput={() => {}}
          onReset={() => {}}
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
              onSubmit={(text) => handleSentenceSubmit(sentence.id, text, index)}
              onMouseEnter={() => mouseHasMoved && setHoveredSentenceIndex(index)}
              onMouseLeave={() => mouseHasMoved && setHoveredSentenceIndex(null)}
            />
            {/* Add a space and ⊕ symbol if the sentence has remarks */}
            {sentence.remarks.length > 0 && (
              <>
                {' '}
                <span 
                  className="text-white inline-block cursor-pointer" 
                  style={{ verticalAlign: 'sub', fontSize: '0.8em' }}
                  onClick={() => handleRemarkClick(index)}
                  onMouseEnter={() => onRemarkMouseEnter(sentence.id)}
                  onMouseLeave={onRemarkMouseLeave}
                >
                  ⊕
                </span>
              </>
            )}
            <CursorSpace
              id={`${paragraph.id}-${index}`}
              onEnter={(text) => handleCursorSpaceEnter(text, paragraph.id, index + 1, false)}
              onFocus={() => setFocusedCursorSpaceId(`${paragraph.id}-${index}`)}
              isFocused={focusedCursorSpaceId === `${paragraph.id}-${index}`}
              isFirst={false}
              isLast={index === paragraph.sentences.length - 1}
              showSolidCursor={
                mouseHasMoved && (
                  (hoveredSentenceIndex === index) || 
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
              onInput={(text) => onCursorSpaceInput(`${paragraph.id}-${index}`, text)}
              onReset={() => onCursorSpaceReset(`${paragraph.id}-${index}`)}
              ref={(el) => {
                if (el) {
                  cursorSpaceRefs.current[`${paragraph.id}-${index}`] = el
                }
              }}
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
        onEnter={(text) => {
          handleSeparatorEnter(text, 'after')
          onNewContent(text, 'user', 'sentence')
        }}
        onFocus={() => {
          setFocusedCursorSpaceId(`separator-after-${paragraph.id}`)
          // Reset all other cursor spaces
          Object.entries(cursorSpaceRefs.current).forEach(([id, ref]) => {
            if (id !== `separator-after-${paragraph.id}`) {
              ref.resetContent()
            }
          })
        }}
        isFocused={focusedCursorSpaceId === `separator-after-${paragraph.id}`}
        isLast={isLast}
        isDisabled={newlyPlacedSentenceId !== null}
      />
    </>
  )
}

interface InteractiveDocumentProps {
  onNewContent: (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark') => void
  onContentClick: (messageId: string, type: 'sentence' | 'remark') => void
  onNewResponse: (text: string, respondingToId: string, respondingToType: 'sentence' | 'remark') => void
  onRemarkHover: (remarkText: string | null) => void // Add this prop
  onRemarkAction: (action: string) => void // Add this new prop
}

const InteractiveDocument = forwardRef<any, InteractiveDocumentProps>((props, ref) => {
  const { onNewContent, onContentClick, onNewResponse, onRemarkHover, onRemarkAction } = props
  const [title, setTitle] = useState('Untitled')
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
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([]) // Add this state for messages
  const inputRef = useRef<HTMLInputElement>(null) // Add this ref for the input
  const [cursorSpaceContent, setCursorSpaceContent] = useState<{ [key: string]: string }>({})
  const cursorSpaceRefs = useRef<{ [key: string]: { resetContent: () => void } }>({})

  useImperativeHandle(ref, () => ({
    handleNewResponse: (text: string, respondingToId: string, respondingToType: 'sentence' | 'remark') => {
      // Implement the logic for handling new responses here
      onNewContent(text, 'ai', respondingToType)
    }
  }))

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
    onNewContent(newRemark, 'ai', 'remark')
  }, [onNewContent])

  const addSentence = useCallback((text: string, paragraphId: string, index: number, isReplacingRemark: boolean = false) => {
    const newSentenceId = Date.now().toString()
    setParagraphs((prevParagraphs) => {
      const newParagraphs = prevParagraphs.map(paragraph => {
        if (paragraph.id === paragraphId) {
          const newSentences = [...paragraph.sentences]
          if (isReplacingRemark && index > 0) {
            newSentences[index - 1] = { ...newSentences[index - 1], remarks: [], remarkColor: undefined }
          }
          newSentences.splice(index, 0, { id: newSentenceId, text, remarks: [], remarkColor: undefined })
          return { ...paragraph, sentences: newSentences }
        }
        return paragraph
      })
      return newParagraphs
    })
    
    onNewContent(text, 'user', 'sentence')

    // Focus on the next cursor space after the new sentence
    setTimeout(() => {
      setFocusedCursorSpaceId(`${paragraphId}-${index}`)
    }, 0)

    // Set timeouts to add remarks after 2 seconds and 5 seconds
    setTimeout(() => addRemark(newSentenceId), 2000)
    setTimeout(() => addRemark(newSentenceId), 5000)
  }, [onNewContent, setFocusedCursorSpaceId, addRemark])

  const handleCursorSpaceEnter = useCallback((text: string, paragraphId: string, index: number, isRemarkCursor: boolean = false) => {
    addSentence(text, paragraphId, index, isRemarkCursor)
  }, [addSentence])

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

        // Remove this timeout as we're now handling it in the addSentence function
        // setTimeout(() => addRemark(newSentence.id), 5000)
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

  const handleDocumentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (paragraphs.length > 0) {
        const lastParagraph = paragraphs[paragraphs.length - 1]
        const lastSentenceIndex = lastParagraph.sentences.length - 1
        const lastCursorSpaceId = `${lastParagraph.id}-${lastSentenceIndex}`
        setFocusedCursorSpaceId(lastCursorSpaceId)
      }
    }

    // Reset all cursor spaces except the focused one
    Object.entries(cursorSpaceRefs.current).forEach(([id, ref]) => {
      if (id !== focusedCursorSpaceId) {
        ref.resetContent()
      }
    })
  }, [paragraphs, focusedCursorSpaceId])

  const handleNewMessage = useCallback((text: string) => {
    if (selectedSentenceId) {
      // Find the paragraph and sentence index of the selected sentence
      let targetParagraphIndex = -1
      
      for (let i = 0; i < paragraphs.length; i++) {
        const sentenceIndex = paragraphs[i].sentences.findIndex(s => s.id === selectedSentenceId)
        if (sentenceIndex !== -1) {
          targetParagraphIndex = i
          break
        }
      }

      if (targetParagraphIndex !== -1) {
        // Create a new paragraph with the new sentence
        const newParagraphId = Date.now().toString()
        const newSentence: Sentence = { id: `${newParagraphId}-1`, text, remarks: [], remarkColor: undefined }
        const newParagraph: Paragraph = { id: newParagraphId, sentences: [newSentence] }

        // Insert the new paragraph after the one containing the selected sentence
        setParagraphs(prevParagraphs => {
          const newParagraphs = [...prevParagraphs]
          newParagraphs.splice(targetParagraphIndex + 1, 0, newParagraph)
          return newParagraphs
        })

        // Reset the selected sentence
        setSelectedSentenceId(null)

        // Call onNewContent
        onNewContent(text, 'user', 'sentence')

        // Focus on the new cursor space after adding the sentence
        setTimeout(() => {
          setFocusedCursorSpaceId(`${newParagraphId}-0`)
        }, 0)

        // Set timeouts to add remarks after 2 seconds and 5 seconds
        setTimeout(() => addRemark(`${newParagraphId}-1`), 2000)
        setTimeout(() => addRemark(`${newParagraphId}-1`), 5000)
      } else {
        // If the selected sentence wasn't found, add the sentence to the end
        addSentence(text, paragraphs[paragraphs.length - 1].id, paragraphs[paragraphs.length - 1].sentences.length)
      }
    } else {
      // If no sentence was selected, add the sentence to the end
      addSentence(text, paragraphs[paragraphs.length - 1].id, paragraphs[paragraphs.length - 1].sentences.length)
    }

    // Add the new message to the messages state
    setMessages(prevMessages => [...prevMessages, {
      id: Date.now().toString(),
      text,
      sender: 'user',
      type: 'sentence'
    }])
  }, [paragraphs, selectedSentenceId, addSentence, onNewContent, setFocusedCursorSpaceId, addRemark])

  const handleMessageClick = useCallback((messageId: string, type: 'sentence' | 'remark') => {
    if (type === 'sentence') {
      setSelectedSentenceId(messageId)
    } else {
      setSelectedSentenceId(null)
    }
  }, [])

  const handleCursorSpaceInput = useCallback((id: string, content: string) => {
    setCursorSpaceContent(prev => ({ ...prev, [id]: content }))
  }, [])

  const handleCursorSpaceReset = useCallback((id: string) => {
    setCursorSpaceContent(prev => {
      const newContent = { ...prev }
      delete newContent[id]
      return newContent
    })
  }, [])

  const handleRemarkMouseEnter = useCallback((sentenceId: string) => {
    const sentence = paragraphs.flatMap(p => p.sentences).find(s => s.id === sentenceId)
    if (sentence && sentence.remarks.length > 0) {
      const mostRecentRemark = sentence.remarks[sentence.remarks.length - 1]
      onRemarkHover(mostRecentRemark)
      
      // Dummy function that fires if the if statement is triggered
      const dummyRemarkAction = () => {
        onRemarkAction('hover_action')
      }
      dummyRemarkAction()
    }
  }, [paragraphs, onRemarkHover, onRemarkAction])

  const handleRemarkMouseLeave = useCallback(() => {
    onRemarkHover(null)
  }, [onRemarkHover])

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="document-container min-h-screen" 
        onClick={handleDocumentClick}
      >
        <div className="document-content">
          <h1
            className="text-3xl font-bold mb-4"
            contentEditable
            spellCheck={false}
            suppressContentEditableWarning
            onBlur={(e) => setTitle(e.currentTarget.textContent || '')}
          >
            {title}
          </h1>

          <ParagraphSeparator
            id={`separator-before-first`}
            onEnter={(text) => {
              const newParagraphId = addParagraph(0, text)
              setFocusedCursorSpaceId(`${newParagraphId}-0`)
              setFocusParagraphId(newParagraphId)
              onNewContent(text, 'user', 'sentence')
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
              onNewContent={onNewContent}
              handleCursorSpaceEnter={handleCursorSpaceEnter}
              addRemark={addRemark}
              onCursorSpaceInput={handleCursorSpaceInput}
              onCursorSpaceReset={handleCursorSpaceReset}
              cursorSpaceRefs={cursorSpaceRefs}
              onRemarkMouseEnter={handleRemarkMouseEnter}
              onRemarkMouseLeave={handleRemarkMouseLeave}
            />
          ))}
        </div>
      </div>
      <Messenger
        messages={messages}
        onNewMessage={handleNewMessage}
        onMessageClick={handleMessageClick}
        selectedMessageId={selectedSentenceId}
        selectedMessageType={selectedSentenceId ? 'sentence' : null}
        inputRef={inputRef}
        onRemarkAction={onRemarkAction} // Pass the onRemarkAction prop to Messenger
      />
    </DndProvider>
  )
})

InteractiveDocument.displayName = 'InteractiveDocument'

export default InteractiveDocument