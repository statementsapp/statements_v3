'use client'

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { generateRandomSentence } from '../utils/sentenceGenerator' // You'll need to create this utility function
import { Message } from './Messenger' // Remove MessengerProps from this import
import { Check } from 'lucide-react'

type Remark = {
  id: string;
  text: string;
  sentenceId: string;
  rejoined: boolean;
}

type Sentence = {
  id: string
  sentenceId: string
  text: string
  remarks: Remark[]
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
  HTMLSpanElement,
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
    content: string
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
  onReset,
  content
}, ref) => {
  const [text, setText] = useState(content)
  const inputRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setText(content)
    // Move cursor to the end of the content when it changes
    if (inputRef.current) {
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(inputRef.current)
      range.collapse(false) // This collapses the range to the end
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [content])

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(inputRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isFocused])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && text.trim() !== '') {
      e.preventDefault()
      onEnter(text)
      setText('')
    }
  }

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const newText = e.currentTarget.textContent || ''
    setText(newText)
    onInput(newText)
  }

  const resetContent = () => {
    setText('')
    onReset()
  }

  useImperativeHandle(ref, () => ({
    resetContent
  }))

  return (
    <span 
      id={id}
      className={`inline ${isFirst ? '' : 'ml-[0.2em]'} ${isLast ? 'mr-0' : ''} ${isSeparator ? 'w-full' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {!isRemarkCursor && (
        <span
          ref={inputRef}
          contentEditable={!isDisabled}
          suppressContentEditableWarning
          className={`inline-block min-w-[1ch] outline-none ${
            isFocused ? 'bg-transparent' : ''
          } ${isSeparator ? 'w-full' : ''} pl-[0.3em]`}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
        >
          {text}
        </span>
      )}
      {/* Remove the solid cursor here */}
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
  onRemarkClick: (sentenceId: string) => void
  onRemarkMouseEnter: (sentenceId: string) => void
  onRemarkMouseLeave: () => void
}> = ({ 
  sentence, 
  onClick, 
  isEditing, 
  onInput, 
  onSubmit, 
  isDragging, 
  onMouseEnter, 
  onMouseLeave, 
  onSentenceClick,
  onRemarkClick,
  onRemarkMouseEnter,
  onRemarkMouseLeave
}) => {
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

  const handleRemarkClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the sentence click event from firing
    onRemarkClick(sentence.id)
  }

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
      {/* do not place a † here */}
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
  onRemarkMouseEnter: (sentenceId: string) => void
  onRemarkMouseLeave: () => void
  onRemarkClick: (sentenceId: string) => void
}> = ({ sentence, paragraphId, index, moveSentence, onClick, isEditing, onInput, onSubmit, onMouseEnter, onMouseLeave, onRemarkMouseEnter, onRemarkMouseLeave, onRemarkClick }) => {
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

  const handleEnter = (text: string) => {
    if (text.trim()) {
      onEnter(text);
    }
  };

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
        onEnter={handleEnter}
        onFocus={onFocus}
        isFocused={isFocused}
        isFirst={true}
        isLast={isLast}
        showSolidCursor={false}
        isSeparator={true}
        ref={cursorSpaceRef as React.Ref<HTMLSpanElement>}
        isDisabled={isDisabled ?? false}
        onInput={() => {}}
        onReset={() => {}}
        content=""
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
  addParagraph: (index: number, text: string) => { paragraphId: string, sentenceId: string }
  paragraphIndex: number
  moveSentence: (sentenceId: string, sourceParagraphId: string, targetParagraphId: string, targetIndex: number) => void
  newlyPlacedSentenceId: string | null
  onNewContent: (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark', id: string, sentenceId?: string) => void
  handleCursorSpaceEnter: (text: string, paragraphId: string, index: number, isRemarkCursor: boolean) => void
  addRemark: (sentenceId: string) => void
  onCursorSpaceInput: (id: string, content: string) => void
  onCursorSpaceReset: (id: string) => void
  cursorSpaceRefs: React.MutableRefObject<{ [key: string]: { resetContent: () => void } }>
  onRemarkMouseEnter: (sentenceId: string) => void
  onRemarkMouseLeave: () => void
  onRemarkClick: (sentenceId: string) => void
  onSentenceClick: (sentenceId: string, paragraphId: string, index: number, e: React.MouseEvent) => void
  onEmphasizeRemark: (remarkId: string | null, sentenceId: string | null) => void
  onRemarkHover: (remarkId: string | null, remarkText: string | null) => void // Updated this prop
  scrollToMessage: (messageId: string) => void
  emphasizedRemarkIds: { [sentenceId: string]: string }
  cursorSpaceContent: { [key: string]: string } // Add this prop
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
  moveSentence,
  newlyPlacedSentenceId,
  onNewContent,
  handleCursorSpaceEnter,
  addRemark,
  onCursorSpaceInput,
  onCursorSpaceReset,
  cursorSpaceRefs,
  onRemarkMouseEnter,
  onRemarkMouseLeave,
  onRemarkClick,
  onSentenceClick,
  onEmphasizeRemark,
  onRemarkHover,
  scrollToMessage,
  emphasizedRemarkIds,
  cursorSpaceContent // Add this prop
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

  // Remove or comment out the handleLastCursorMouseEnter and handleLastCursorMouseLeave functions

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
    onSentenceClick(sentenceId, paragraph.id, index, e)
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
    onNewContent(text, 'user', 'sentence', sentenceId)
    setEditingSentenceId(null)
    setFocusedCursorSpaceId(`${paragraph.id}-${index}`)
    
    // Generate remarks for the edited sentence
    console.log("A")
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
    const { paragraphId, sentenceId } = addParagraph(index, text)
    setFocusedCursorSpaceId(`${paragraphId}-0`)
    // Remove the onNewContent call from here, as it's already called in addParagraph
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

  const handleRemarkMouseEnter = (sentenceId: string) => {
    // Clear emphasis on all other messages
    props.onClearEmphasis();

    // Clear input box content and unfocus it
    props.onClearInput();
    if (props.inputRef.current) {
      props.inputRef.current.blur();
    }

    // Find the sentence in the paragraphs
    const sentence = paragraphs.flatMap(p => p.sentences).find(s => s.id === sentenceId);
    
    if (sentence && sentence.remarks.length > 0) {
      const mostRecentRemark = sentence.remarks[sentence.remarks.length - 1];
      
      // Set the emphasized remark and sentence IDs
      props.onEmphasizeRemark(mostRecentRemark.id, sentenceId);
    }

    // Reset the first click state
    setIsFirstClick(true);
  }

  const handleRemarkClick = (sentenceId: string) => {
    onRemarkClick(sentenceId);
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
          content=""
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
              onRemarkMouseEnter={onRemarkMouseEnter}
              onRemarkMouseLeave={onRemarkMouseLeave}
              onRemarkClick={handleRemarkClick}
            />
            {/* Update this part to check if there are any unrejoined remarks */}
            {sentence.remarks.length > 0 && sentence.remarks.some(remark => !remark.rejoined) && (
              <>
                {' '}
                <span 
                  className="text-white inline-block cursor-pointer" 
                  style={{ verticalAlign: 'top', fontSize: '1em' }}
                  onClick={() => handleRemarkClick(sentence.id)}
                  onMouseEnter={() => onRemarkMouseEnter(sentence.id)}
                  onMouseLeave={onRemarkMouseLeave}
                >
                  †
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
              showSolidCursor={false} // Always set this to false
              onMouseEnter={() => {}} // Empty function
              onMouseLeave={() => {}} // Empty function
              isDisabled={newlyPlacedSentenceId !== null}
              onInput={(text) => onCursorSpaceInput(`${paragraph.id}-${index}`, text)}
              onReset={() => onCursorSpaceReset(`${paragraph.id}-${index}`)}
              ref={(el) => {
                if (el) {
                  cursorSpaceRefs.current[`${paragraph.id}-${index}`] = el
                }
              }}
              content={cursorSpaceContent[`${paragraph.id}-${index}`] || ''}
            />
            {/* Add a space after each sentence except the last one */}
            {index < paragraph.sentences.length - 1 && ' '}
          </React.Fragment>
        ))}
      </p>
      <ParagraphSeparator
        id={`separator-after-${paragraph.id}`}
        onEnter={(text) => {
          handleSeparatorEnter(text, 'after')
          onNewContent(text, 'user', 'sentence', Date.now().toString())
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
  onNewContent: (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark', id: string, sentenceId?: string) => void
  onContentClick: (messageId: string, type: 'sentence' | 'remark') => void
  onNewResponse: (text: string, respondingToId: string, respondingToType: 'sentence' | 'remark') => void
  onRemarkHover: (remarkId: string | null, remarkText: string | null) => void // Updated this prop
  onRemarkAction: (action: string, remarkId: string) => void // Updated this prop
  onEmphasizeRemark: (remarkId: string | null, sentenceId: string | null) => void
  onRemarkClick: (sentenceId: string) => void // Add this line
  onDocumentClick: (clickType: 'document' | 'sentence', sentenceId?: string) => void;
  emphasizedSentenceId: string | null;
  emphasizedSentenceType: 'sentence' | 'remark' | null;
  onClearEmphasis: () => void;
  onClearInput: () => void; // Add this new prop
  inputRef: React.RefObject<HTMLInputElement>;
}

const InteractiveDocument = forwardRef<any, InteractiveDocumentProps>((props, ref) => {
  const { onNewContent, onContentClick, onNewResponse, onRemarkHover, onRemarkAction, onEmphasizeRemark, onRemarkClick, onDocumentClick } = props
  const [title, setTitle] = useState('Untitled')
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([
    {
      id: '1',
      sentences: [
        { id: '1', sentenceId: '1', text: 'This is the first sentence of the first paragraph.', remarks: [], remarkColor: undefined },
        { id: '2', sentenceId: '2', text: 'Here is the second sentence.', remarks: [], remarkColor: undefined },
        { id: '3', sentenceId: '3', text: 'The third sentence follows.', remarks: [], remarkColor: undefined },
        { id: '4', sentenceId: '4', text: 'This is the fourth and final sentence of the first paragraph.', remarks: [], remarkColor: undefined },
      ],
    },
    {
      id: '2',
      sentences: [
        { id: '5', sentenceId: '5', text: 'The second paragraph begins with this sentence.', remarks: [], remarkColor: undefined },
        { id: '6', sentenceId: '6', text: 'Here is the second sentence of the second paragraph.', remarks: [], remarkColor: undefined },
        { id: '7', sentenceId: '7', text: 'The third sentence continues the thought.', remarks: [], remarkColor: undefined },
        { id: '8', sentenceId: '8', text: 'This final sentence concludes the second paragraph.', remarks: [], remarkColor: undefined },
      ],
    },
    {
      id: '3',
      sentences: [
        { id: '9', sentenceId: '9', text: 'The third paragraph begins with this sentence.', remarks: [], remarkColor: undefined },
        { id: '10', sentenceId: '10', text: 'Look at this sentence', remarks: [], remarkColor: undefined },
        { id: '11', sentenceId: '11', text: 'The third sentence continues the thought.', remarks: [], remarkColor: undefined },
        { id: '12', sentenceId: '12', text: 'So much sentence and this is the final sentence of this paragraph.', remarks: [], remarkColor: undefined },
      ],
    },
  ])
  const [editingSentenceId, setEditingSentenceId] = useState<string | null>(null)
  const [focusedCursorSpaceId, setFocusedCursorSpaceId] = useState<string | null>(null)
  const [newlyPlacedSentence, setNewlyPlacedSentence] = useState<{ id: string, initialX: number, initialY: number } | null>(null)
  const mouseMoveThreshold = 30
  const [thresholdReached, setThresholdReached] = useState(false)
  const [remarks, setRemarks] = useState<{ [key: string]: string[] }>({})
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([]) // Add this state for messages
  const inputRef = useRef<HTMLInputElement>(null) // Add this ref for the input
  const [cursorSpaceContent, setCursorSpaceContent] = useState<{ [key: string]: string }>({})
  const cursorSpaceRefs = useRef<{ [key: string]: { resetContent: () => void } }>({})
  const [emphasizedRemarkIds, setEmphasizedRemarkIds] = useState<{ [sentenceId: string]: string }>({})
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [lastClickedSentenceId, setLastClickedSentenceId] = useState<string | null>(null)

  const documentRef = useRef<any>(null);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Add this new state variable
  const [isDaggerClicked, setIsDaggerClicked] = useState(false)

  const [emphasizedRemarkId, setEmphasizedRemarkId] = useState<string | null>(null);
  const [emphasizedSentenceId, setEmphasizedSentenceId] = useState<string | null>(null);

  const [isFirstClick, setIsFirstClick] = useState(true);

  useImperativeHandle(ref, () => ({
    handleNewResponse: (text: string, respondingToId: string, respondingToType: 'sentence' | 'remark') => {
      // Implement the logic for handling new responses here
      onNewContent(text, 'ai', respondingToType, respondingToId)
    }
  }))

  const addRemark = useCallback((sentenceId: string) => {
    const newRemarkText = generateRandomSentence()
    const newRemarkId = `remark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const pastelColor = `hsl(${Math.random() * 360}, 100%, 80%)`
    
    setParagraphs((prevParagraphs) => {
      return prevParagraphs.map(paragraph => ({
        ...paragraph,
        sentences: paragraph.sentences.map(sentence => 
          sentence.id === sentenceId
            ? { 
                ...sentence, 
                remarks: [...(sentence.remarks || []), { id: newRemarkId, text: newRemarkText, sentenceId, rejoined: false }],
                remarkColor: sentence.remarkColor || pastelColor
              }
            : sentence
        )
      }))
    })
    onNewContent(newRemarkText, 'ai', 'remark', newRemarkId, sentenceId)
    return newRemarkId
  }, [onNewContent])

  const addSentence = useCallback((text: string, paragraphId: string, index: number, isReplacingRemark: boolean = false) => {
    const newSentenceId = Date.now().toString()
    console.log('Sentence ID created:', newSentenceId)
    setParagraphs((prevParagraphs) => {
      const newParagraphs = [...prevParagraphs]
      const paragraphIndex = newParagraphs.findIndex(p => p.id === paragraphId)
      if (paragraphIndex !== -1) {
        const newSentences = [...newParagraphs[paragraphIndex].sentences]
        if (isReplacingRemark && index > 0) {
          newSentences[index - 1] = { ...newSentences[index - 1], remarks: [], remarkColor: undefined }
        }
        newSentences.splice(index, 0, { 
          id: newSentenceId, 
          sentenceId: newSentenceId, // Add this line to set sentenceId
          text, 
          remarks: [], 
          remarkColor: undefined 
        })
        newParagraphs[paragraphIndex] = { ...newParagraphs[paragraphIndex], sentences: newSentences }
      }
      return newParagraphs
    })
    
    // Create the message here
    onNewContent(text, 'user', 'sentence', newSentenceId, newSentenceId) // Add sentenceId here

    // Focus on the next cursor space after the new sentence
    setTimeout(() => {
      setFocusedCursorSpaceId(`${paragraphId}-${index}`)
    }, 0)

    // Set timeouts to add remarks after 2 seconds and 5 seconds
    console.log("B")
    setTimeout(() => addRemark(newSentenceId), 2000)
    setTimeout(() => addRemark(newSentenceId), 5000)

    return newSentenceId // Return the new sentence ID
  }, [setFocusedCursorSpaceId, addRemark, onNewContent])

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
        // console.log('Mouse movement threshold reached. Expansions and solid cursors are now active.')
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

  const addParagraph = useCallback((index: number, text: string): { paragraphId: string, sentenceId: string } => {
    console.log("Add paragraph called")
    const newParagraphId = Date.now().toString();
    const newSentenceId = `${newParagraphId}-1`;
    const newParagraph: Paragraph = {
      id: newParagraphId,
      sentences: [{ id: newSentenceId, sentenceId: newSentenceId, text, remarks: [], remarkColor: undefined }],
    };
    setParagraphs((prevParagraphs) => {
      const newParagraphs = [...prevParagraphs];
      newParagraphs.splice(index, 0, newParagraph);
      return newParagraphs;
    });
    
    // Remove the onNewContent call from here
    // props.onNewContent(text, 'user', 'sentence', newSentenceId);
    setTimeout(() => addRemark(newSentenceId), 2000);
    setTimeout(() => addRemark(newSentenceId), 5000);
    
    return { paragraphId: newParagraphId, sentenceId: newSentenceId };
  }, []);

  // Remove the useEffect that was handling focusParagraphId

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
    // Check if the click is directly on the document container
    if (e.target === e.currentTarget) {
      if (paragraphs.length > 0) {
        const lastParagraph = paragraphs[paragraphs.length - 1]
        const lastSentenceIndex = lastParagraph.sentences.length - 1
        const lastCursorSpaceId = `${lastParagraph.id}-${lastSentenceIndex}`
        setFocusedCursorSpaceId(lastCursorSpaceId)
      }
      // Call onDocumentClick with 'document' type to reset emphasis in the messenger
      props.onDocumentClick('document')
    }

    // Reset all cursor spaces except the focused one
    Object.entries(cursorSpaceRefs.current).forEach(([id, ref]) => {
      if (id !== focusedCursorSpaceId) {
        ref.resetContent()
      }
    })

    // Always call onDocumentClick to reset emphasis, even for clicks on sentences or other elements
    props.onDocumentClick('document')
  }, [paragraphs, focusedCursorSpaceId, props.onDocumentClick])

  const handleNewMessage = useCallback((text: string) => {
    console.log("handleNewMessage called from interactive document")
    let newSentenceId: string;
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
        console.log('New paragraph ID created in handleNewMessage:', newParagraphId)
        newSentenceId = `${newParagraphId}-1`
        console.log('New sentence ID created in handleNewMessage:', newSentenceId)
        const newSentence: Sentence = { id: newSentenceId, sentenceId: newSentenceId, text, remarks: [], remarkColor: undefined }
        const newParagraph: Paragraph = { id: newParagraphId, sentences: [newSentence] }

        // Insert the new paragraph after the one containing the selected sentence
        setParagraphs(prevParagraphs => {
          const newParagraphs = [...prevParagraphs]
          newParagraphs.splice(targetParagraphIndex + 1, 0, newParagraph)
          return newParagraphs
        })

        // Reset the selected sentence
        setSelectedSentenceId(null)

        // Focus on the new cursor space after adding the sentence
        setTimeout(() => {
          setFocusedCursorSpaceId(`${newParagraphId}-0`)
        }, 0)

        // Set timeouts to add remarks after 2 seconds and 5 seconds
        console.log("C")
        setTimeout(() => addRemark(newSentenceId), 2000)
        setTimeout(() => addRemark(newSentenceId), 5000)
      } else {
        // If the selected sentence wasn't found, add the sentence to the end
        newSentenceId = addSentence(text, paragraphs[paragraphs.length - 1].id, paragraphs[paragraphs.length - 1].sentences.length)
      }
    } else {
      // If no sentence was selected, add the sentence to the end
      newSentenceId = addSentence(text, paragraphs[paragraphs.length - 1].id, paragraphs[paragraphs.length - 1].sentences.length)
    }

    // Call onNewContent with the new sentence ID
    onNewContent(text, 'user', 'sentence', newSentenceId)

    // Add the new message to the messages state
    setMessages(prevMessages => [...prevMessages, {
      id: newSentenceId,
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
    // Clear emphasis on all other messages
    props.onClearEmphasis();

    // Clear input box content and unfocus it
    props.onClearInput();
    if (props.inputRef.current) {
      props.inputRef.current.blur();
    }

    // Find the sentence in the paragraphs
    const sentence = paragraphs.flatMap(p => p.sentences).find(s => s.id === sentenceId);
    
    if (sentence && sentence.remarks.length > 0) {
      const mostRecentRemark = sentence.remarks[sentence.remarks.length - 1];
      
      // Set the emphasized remark and sentence IDs
      props.onEmphasizeRemark(mostRecentRemark.id, sentenceId);
    }

    // Reset the first click state
    setIsFirstClick(true);
  }, [paragraphs, props.onEmphasizeRemark, props.onClearEmphasis, props.onClearInput, props.inputRef]);

  const handleRemarkClick = useCallback((sentenceId: string) => {
    setIsDaggerClicked(true);

    if (isFirstClick) {
      // On first click, just focus the input box
      if (props.inputRef && props.inputRef.current) {
        props.inputRef.current.focus();
      }
      setIsFirstClick(false);
    } else {
      // On subsequent clicks, cycle through remarks
      const sentence = paragraphs.flatMap(p => p.sentences).find(s => s.id === sentenceId);
      
      if (sentence && sentence.remarks.length > 0) {
        let nextRemarkIndex = -1;
        const currentRemarkId = emphasizedRemarkId;
        const currentIndex = sentence.remarks.findIndex(r => r.id === currentRemarkId);
        
        // Find the next non-rejoined remark
        for (let i = 1; i <= sentence.remarks.length; i++) {
          const index = (currentIndex + i) % sentence.remarks.length;
          if (!sentence.remarks[index].rejoined) {
            nextRemarkIndex = index;
            break;
          }
        }

        if (nextRemarkIndex !== -1) {
          const nextRemark = sentence.remarks[nextRemarkIndex];
          setEmphasizedRemarkId(nextRemark.id);
          setEmphasizedSentenceId(sentenceId);
          onEmphasizeRemark(nextRemark.id, sentenceId);
          onRemarkHover(nextRemark.id, nextRemark.text);
        } else {
          // If all remarks are rejoined, clear the emphasis
          setEmphasizedRemarkId(null);
          setEmphasizedSentenceId(null);
          onEmphasizeRemark(null, null);
          onRemarkHover(null, null);
        }
      } else {
        // If there are no remarks, clear the emphasis
        setEmphasizedRemarkId(null);
        setEmphasizedSentenceId(null);
        onEmphasizeRemark(null, null);
        onRemarkHover(null, null);
      }
    }
  }, [paragraphs, emphasizedRemarkId, onEmphasizeRemark, onRemarkHover, setEmphasizedRemarkId, setEmphasizedSentenceId, isFirstClick, props.inputRef]);

  const handleRemarkMouseLeave = useCallback(() => {
    console.log("handleRemarkMouseLeave called");
    if (!isDaggerClicked) {
      setEmphasizedRemarkId(null);
      setEmphasizedSentenceId(null);
      props.onEmphasizeRemark(null, null);
    }
    // Reset the isDaggerClicked state for the next interaction
    setIsDaggerClicked(false);
    // Reset the first click state
    setIsFirstClick(true);
  }, [props.onEmphasizeRemark, isDaggerClicked]);

  const scrollToMessage = useCallback((messageId: string) => {
    console.log("scrollToMessage called with messageId:", messageId);
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      console.log(`Scrolling to message: ${messageId}`);
    } else {
      console.log(`Message element not found for ID: ${messageId}`);
    }
  }, []);

  // Add this new function
  const handleEmphasizeRemark = useCallback((remarkId: string | null, sentenceId: string | null) => {
    if (sentenceId && remarkId) {
      setEmphasizedRemarkIds(prev => ({ ...prev, [sentenceId]: remarkId }));
    } else {
      setEmphasizedRemarkIds({});
    }
    props.onEmphasizeRemark(remarkId, sentenceId);
  }, [props.onEmphasizeRemark]);

  const handleSentenceClick = useCallback((sentenceId: string, paragraphId: string, index: number, e: React.MouseEvent) => {
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - lastClickTime
    const cursorSpaceId = `${paragraphId}-${index}`
    
    if (lastClickedSentenceId === sentenceId && timeDiff < 300) {
      setEditingSentenceId(sentenceId)
      setFocusedCursorSpaceId(null)
    } else {
      setEditingSentenceId(sentenceId)
      setFocusedCursorSpaceId(cursorSpaceId)
    }

    setLastClickedSentenceId(sentenceId)
    setLastClickTime(currentTime)
    moveSentence(sentenceId, paragraphId, paragraphId, index)

    // Clear all unfocused cursor spaces
    Object.entries(cursorSpaceRefs.current).forEach(([id, ref]) => {
      if (id !== cursorSpaceId) {
        ref.resetContent()
      }
    })

    // Call onDocumentClick with 'sentence' type and sentenceId
    onDocumentClick('sentence', sentenceId)
  }, [lastClickTime, lastClickedSentenceId, setEditingSentenceId, setFocusedCursorSpaceId, moveSentence, cursorSpaceRefs, onDocumentClick])

  // Update the addSentenceAfter method
  const addSentenceAfter = useCallback((afterSentenceId: string, newSentenceText: string, newSentenceId: string) => {
    console.log("Adding sentence after")

    setParagraphs((prevParagraphs) => {
      const updatedParagraphs = prevParagraphs.map((paragraph) => {
        const afterIndex = paragraph.sentences.findIndex((s) => s.id === afterSentenceId);
        if (afterIndex === -1) return paragraph;

        const newSentence = { id: newSentenceId, sentenceId: newSentenceId, text: newSentenceText, remarks: [], remarkColor: undefined };
        
        const updatedSentences = [
          ...paragraph.sentences.slice(0, afterIndex + 1),
          newSentence,
          ...paragraph.sentences.slice(afterIndex + 1)
        ];

        return { ...paragraph, sentences: updatedSentences };
      });

      return updatedParagraphs;
    });

    // Add remarks after 2 seconds and 5 seconds
    console.log("D")
    setTimeout(() => addRemark(newSentenceId), 2000);
    setTimeout(() => addRemark(newSentenceId), 5000);

    return newSentenceId;
  }, [addRemark]);

  // Update the addParagraphAfterSentence method
  const addParagraphAfterSentence = useCallback((sentenceId: string | null, text: string, rejoinedRemarkId?: string, newSentenceId?: string) => {
    console.log("Adding paragraph after sentence. sentenceId:", sentenceId, "text:", text, "rejoinedRemarkId:", rejoinedRemarkId, "newSentenceId:", newSentenceId);
    
    if (!newSentenceId) {
      newSentenceId = `sentence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    let newParagraphId: string;
    
    if (!sentenceId) {
      console.log("No sentence is emphasized");
      // If no sentence is emphasized, add the paragraph at the end
      newParagraphId = Date.now().toString();
      const newParagraph: Paragraph = {
        id: newParagraphId,
        sentences: [{ id: newSentenceId, sentenceId: newSentenceId, text, remarks: [], remarkColor: undefined }],
      };

      setParagraphs(prevParagraphs => [...prevParagraphs, newParagraph]);
    } else {
      // Find the paragraph containing the sentence
      const paragraphIndex = paragraphs.findIndex(p => p.sentences.some(s => s.id === sentenceId));
    
      if (paragraphIndex === -1) {
        console.error('Sentence not found:', sentenceId);
        return null;
      }

      newParagraphId = Date.now().toString();
      const newParagraph: Paragraph = {
        id: newParagraphId,
        sentences: [{ id: newSentenceId, sentenceId: newSentenceId, text, remarks: [], remarkColor: undefined }],
      };

      setParagraphs(prevParagraphs => {
        const newParagraphs = [...prevParagraphs];
        // Insert the new paragraph right after the paragraph containing the sentence
        newParagraphs.splice(paragraphIndex + 1, 0, newParagraph);

        // Mark the remark as rejoined if rejoinedRemarkId is provided
        if (rejoinedRemarkId) {
          const sentence = newParagraphs[paragraphIndex].sentences.find(s => s.id === sentenceId);
          if (sentence) {
            const remarkIndex = sentence.remarks.findIndex(r => r.id === rejoinedRemarkId);
            if (remarkIndex !== -1) {
              sentence.remarks[remarkIndex] = { ...sentence.remarks[remarkIndex], rejoined: true };
              console.log('Remark newly rejoined:', sentence.remarks[remarkIndex]);
            }
          }
        }

        return newParagraphs;
      });
    }

    console.log('About to return newSentenceId:', newSentenceId);
    
    // Add remarks after 2 seconds and 5 seconds
    console.log("E")
    setTimeout(() => addRemark(newSentenceId!), 2000);
    setTimeout(() => addRemark(newSentenceId!), 5000);

    // Set the cursor after the new sentence
    setTimeout(() => {
      const cursorSpaceId = `${newParagraphId}-0`;
      setFocusedCursorSpaceId(cursorSpaceId);
      const cursorSpace = document.getElementById(cursorSpaceId);
      if (cursorSpace) {
        const contentEditableSpan = cursorSpace.querySelector('span[contenteditable]');
        if (contentEditableSpan) {
          (contentEditableSpan as HTMLElement).focus();
          // Place the cursor at the end of the content
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(contentEditableSpan);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
    }, 0);

    return newSentenceId;
  }, [paragraphs, addRemark, setFocusedCursorSpaceId]);

  // Update the useImperativeHandle hook
  useImperativeHandle(ref, () => ({
    handleNewResponse: (text: string, respondingToId: string, respondingToType: 'sentence' | 'remark') => {
      onNewContent(text, 'ai', respondingToType, respondingToId);
    },
    addSentenceAfter,
    addParagraphAfterSentence,
  }));

  const performAutomatedActions = useCallback(() => {
    const lastParagraph = paragraphs[paragraphs.length - 1];
    const lastSentence = lastParagraph.sentences[lastParagraph.sentences.length - 1];
    const lastCursorSpaceId = `${lastParagraph.id}-${lastParagraph.sentences.length - 1}`;

    // Click the last sentence
    handleSentenceClick(lastSentence.id, lastParagraph.id, lastParagraph.sentences.length - 1, new MouseEvent('click') as any);

    // Type the new sentence one character at a time
    const newSentence = "That the life of Man is but a dream has been sensed by many a one, and I too am never free of the feeling.";
    let index = 0;

    const typeCharacter = () => {
      if (index < newSentence.length) {
        const newContent = newSentence.slice(0, index + 1);
        handleCursorSpaceInput(lastCursorSpaceId, newContent);
        setCursorSpaceContent(prev => ({
          ...prev,
          [lastCursorSpaceId]: newContent
        }));
        index++;
        
        // Move cursor to the end after each character is typed
        setTimeout(() => {
          const cursorSpace = document.getElementById(lastCursorSpaceId);
          if (cursorSpace) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(cursorSpace);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }, 0);
        
        requestAnimationFrame(typeCharacter);
      } else {
        // Commit the sentence
        handleCursorSpaceEnter(newSentence, lastParagraph.id, lastParagraph.sentences.length);
        
        // Clear the cursor space input
        handleCursorSpaceInput(lastCursorSpaceId, '');
        setCursorSpaceContent(prev => ({
          ...prev,
          [lastCursorSpaceId]: ''
        }));
        
        // Reset the focused cursor space
        setFocusedCursorSpaceId(null);
      }
    };

    // Focus on the last cursor space before starting to type
    setFocusedCursorSpaceId(lastCursorSpaceId);

    setTimeout(typeCharacter, 500); // Start typing after a short delay
  }, [paragraphs, handleSentenceClick, handleCursorSpaceInput, handleCursorSpaceEnter, setFocusedCursorSpaceId, setCursorSpaceContent]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="document-container h-full overflow-auto"
        onClick={handleDocumentClick}
        ref={documentRef}
      >
        <div className="document-content">
          {/* Replace the Button component with a simple HTML button */}
          <button 
            onClick={performAutomatedActions}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Perform Automated Actions
          </button>

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
              const { paragraphId, sentenceId } = addParagraph(0, text);
              setFocusedCursorSpaceId(`${paragraphId}-0`);
              // Call onNewContent here instead
              props.onNewContent(text, 'user', 'sentence', sentenceId);
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
              moveSentence={moveSentence}
              newlyPlacedSentenceId={newlyPlacedSentence?.id ?? null}
              onNewContent={props.onNewContent}
              handleCursorSpaceEnter={handleCursorSpaceEnter}
              addRemark={addRemark}
              onCursorSpaceInput={handleCursorSpaceInput}
              onCursorSpaceReset={handleCursorSpaceReset}
              cursorSpaceRefs={cursorSpaceRefs}
              onRemarkMouseEnter={handleRemarkMouseEnter}
              onRemarkMouseLeave={handleRemarkMouseLeave}
              onRemarkClick={handleRemarkClick}
              onSentenceClick={handleSentenceClick}
              onEmphasizeRemark={handleEmphasizeRemark}
              onRemarkHover={props.onRemarkHover}
              scrollToMessage={scrollToMessage}
              emphasizedRemarkIds={emphasizedRemarkIds}
              cursorSpaceContent={cursorSpaceContent} // Pass this prop
            />
          ))}
        </div>
      </div>
    </DndProvider>
  )
})

InteractiveDocument.displayName = 'InteractiveDocument'

export default InteractiveDocument