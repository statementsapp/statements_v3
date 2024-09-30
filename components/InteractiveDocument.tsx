'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

type Sentence = {
  id: string
  text: string
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
  isSeparator?: boolean
  isDisabled: boolean
}>(({ id, onEnter, onFocus, isFocused, isFirst, isLast, showSolidCursor, onMouseEnter, onMouseLeave, isSeparator, isDisabled }, ref) => {
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

  return (
    <span 
      id={id}
      className={`inline-flex items-center ${isFirst ? 'ml-0' : ''} ${isLast ? 'mr-0' : ''} ${isSeparator ? 'w-full' : 'ml-[0.5ch] mr-[0.25ch]'} `} // Changed 'mx-[0.25ch]' to 'ml-[0.5ch] mr-[0.25ch]'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
  index: number
  moveItem: (dragIndex: number, hoverIndex: number) => void
  onClick: (e: React.MouseEvent) => void
  isEditing: boolean
  onInput: (text: string) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}> = ({ sentence, index, moveItem, onClick, isEditing, onInput, onMouseEnter, onMouseLeave }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [{ isDragging }, drag] = useDrag({
    type: 'SENTENCE',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'SENTENCE',
    hover: (item: { index: number }) => { // Removed unused 'monitor' parameter
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      if (dragIndex === hoverIndex) {
        return
      }
      moveItem(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  drag(drop(ref))

  return (
    <span ref={ref} className="inline">
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
  const [isExpanded, setIsExpanded] = useState(false)
  const cursorSpaceRef = useRef<HTMLSpanElement>(null)
  const separatorRef = useRef<HTMLDivElement>(null)
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)

  const debouncedSetIsHovered = useDebounce(setIsHovered, 100)
  const debouncedSetIsExpanded = useDebounce(setIsExpanded, 100)

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!isFocused) {
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
      debouncedSetIsHovered(true)
      debouncedSetIsExpanded(true)
    }
  }, [isFocused, debouncedSetIsHovered, debouncedSetIsExpanded])

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (!isFocused) {
      const lastPosition = lastMousePositionRef.current
      if (lastPosition) {
        const dx = e.clientX - lastPosition.x
        const dy = e.clientY - lastPosition.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Only collapse if the mouse has moved more than 5 pixels
        if (distance > 5) {
          debouncedSetIsHovered(false)
          debouncedSetIsExpanded(false)
        }
      }
    }
  }, [isFocused, debouncedSetIsHovered, debouncedSetIsExpanded])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isFocused) {
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [isFocused])

  const handleFocus = useCallback(() => {
    onFocus()
    setIsHovered(true)
    setIsExpanded(true)
  }, [onFocus])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (separatorRef.current && !separatorRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        setIsHovered(false)
        lastMousePositionRef.current = null
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isFocused) {
      setIsExpanded(true)
    }
  }, [isFocused])

  return (
    <div 
      ref={separatorRef}
      className={`w-full relative flex items-center cursor-text transition-all duration-300 ease-in-out ${
        isExpanded ? 'h-8 mt-[1px] mb-[1px]' : 'h-1 my-[1px]'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
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
        onFocus={handleFocus}
        isFocused={isFocused}
        isFirst={true}
        isLast={isLast}
        showSolidCursor={false}
        isSeparator={true}
        ref={cursorSpaceRef}
        isDisabled={isDisabled}
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
  moveSentence: (sentenceId: string, e: React.MouseEvent) => void
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
    moveSentence(sentenceId, e)
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
    newSentences.splice(index, 0, { id: newSentenceId, text })
    console.log("Handling a cursor space enter")
    updateParagraph({ ...paragraph, sentences: newSentences })
    console.log('Setting focused cursor space ID to:', `${paragraph.id}-${index}`)
    setFocusedCursorSpaceId(`${paragraph.id}-${index}`)
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

  return (
    <>
      <p 
        className="document-paragraph inline-block relative" // Added document-paragraph class
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
          isLast={paragraph.sentences.length === 0} // Added 'isLast' prop
          showSolidCursor={isFirstCursorSpaceHovered}
          onMouseEnter={() => setIsFirstCursorSpaceHovered(true)}
          onMouseLeave={() => setIsFirstCursorSpaceHovered(false)}
          isDisabled={newlyPlacedSentenceId !== null}
        />
        {paragraph.sentences.map((sentence, index) => (
          <React.Fragment key={sentence.id}>
            <DraggableSentence
              sentence={sentence}
              index={index}
              moveItem={moveSentenceWithinParagraph}
              onClick={(e) => handleSentenceClick(sentence.id, index, e)}
              isEditing={editingSentenceId === sentence.id}
              onInput={(text) => handleSentenceInput(sentence.id, text)}
              onMouseEnter={() => setHoveredSentenceIndex(index)}
              onMouseLeave={() => setHoveredSentenceIndex(null)}
            />
            <CursorSpace
              id={`${paragraph.id}-${index}`}
              onEnter={(text) => handleCursorSpaceEnter(text, index + 1)}
              onFocus={() => setFocusedCursorSpaceId(`${paragraph.id}-${index}`)}
              isFocused={focusedCursorSpaceId === `${paragraph.id}-${index}`}
              isFirst={false}
              isLast={index === paragraph.sentences.length - 1} // Added 'isLast' prop
              showSolidCursor={
                hoveredSentenceIndex === index || 
                (isEndingSpaceHovered && index === paragraph.sentences.length - 1)
              }
              onMouseEnter={() => {
                if (index === paragraph.sentences.length - 1) {
                  handleLastCursorMouseEnter()
                }
              }}
              onMouseLeave={() => {
                if (index === paragraph.sentences.length - 1) {
                  handleLastCursorMouseLeave()
                }
              }}
              isDisabled={newlyPlacedSentenceId !== null}
            />
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
        { id: '1', text: 'This is the first sentence of the first paragraph.' },
        { id: '2', text: 'Here is the second sentence.' },
        { id: '3', text: 'The third sentence follows.' },
        { id: '4', text: 'This is the fourth and final sentence of the first paragraph.' },
      ],
    },
    {
      id: '2',
      sentences: [
        { id: '5', text: 'The second paragraph begins with this sentence.' },
        { id: '6', text: 'Here is the second sentence of the second paragraph.' },
        { id: '7', text: 'The third sentence continues the thought.' },
        { id: '8', text: 'This final sentence concludes the second paragraph.' },
      ],
    },
    {
      id: '3',
      sentences: [
        { id: '9', text: 'The third paragraph begins with this sentence.' },
        { id: '10', text: 'Look at this sentence' },
        { id: '11', text: 'The third sentence continues the thought.' },
        { id: '12', text: 'So much sentence and this is the final sentence of this paragraph.' },
      ],
    },
  ])
  const [editingSentenceId, setEditingSentenceId] = useState<string | null>(null)
  const [focusedCursorSpaceId, setFocusedCursorSpaceId] = useState<string | null>(null)
  const [focusParagraphId, setFocusParagraphId] = useState<string | null>(null)
  const [newlyPlacedSentence, setNewlyPlacedSentence] = useState<{ id: string, initialX: number, initialY: number } | null>(null)
  const mouseMoveThreshold = 30
  const [thresholdReached, setThresholdReached] = useState(false)

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
      
      // Find the newly added sentence
      const oldParagraph = prevParagraphs.find(p => p.id === updatedParagraph.id)
      const newSentence = updatedParagraph.sentences.find(s => !oldParagraph?.sentences.some(os => os.id === s.id))
      
      if (newSentence) {
        // Set the newly placed sentence
        setNewlyPlacedSentence({
          id: newSentence.id,
          initialX: window.innerWidth / 2, // Use the center of the screen as initial position
          initialY: window.innerHeight / 2
        })
        setThresholdReached(false)
      }
      
      return newParagraphs
    })
  }

  const addParagraph = (index: number, text: string): string => {
    const newParagraphId = Date.now().toString()
    const newParagraph: Paragraph = {
      id: newParagraphId,
      sentences: [{ id: `${newParagraphId}-1`, text }],
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

  const moveSentence = (sentenceId: string, e: React.MouseEvent) => {
    console.log('Moving sentence:', sentenceId)
    setNewlyPlacedSentence({ id: sentenceId, initialX: e.clientX, initialY: e.clientY })
    setThresholdReached(false)
  }

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