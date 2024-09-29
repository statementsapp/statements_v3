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
}>(({ id, onEnter, onFocus, isFocused, isFirst, isLast, showSolidCursor, onMouseEnter, onMouseLeave, isSeparator }, ref) => {
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

  return (
    <span 
      id={id}
      className={`inline-flex items-center ${isFirst ? 'ml-0' : ''} ${isLast ? 'mr-0' : ''} ${isSeparator ? 'w-full' : 'ml-[0.5ch] mr-[0.25ch]'} `} // Changed 'mx-[0.25ch]' to 'ml-[0.5ch] mr-[0.25ch]'
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
}> = React.memo(({ id, onEnter, onFocus, isFocused, isLast }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const cursorSpaceRef = useRef<HTMLSpanElement>(null)
  const separatorRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (!isFocused) {
      setIsHovered(true)
      setIsExpanded(true)
    }
  }, [isFocused])

  const handleMouseLeave = useCallback(() => {
    if (!isFocused) {
      setIsHovered(false)
      setIsExpanded(false)
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
    >
      {!isFocused && (
        <div 
          className={`absolute left-0 w-1/3 h-1 bg-white transition-opacity duration-300 ease-in-out ${
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
  setFocusParagraphId
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

  // Removed unused 'e' parameter from handleSentenceClick
  const handleSentenceClick = (sentenceId: string, index: number) => { // Removed 'e'
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
    updateParagraph({ ...paragraph, sentences: newSentences })
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
      return // Ignore if the function was called within the last 500ms
    }
    lastSeparatorEnterRef.current = now
    const index = position === 'before' ? paragraphIndex : paragraphIndex + 1
    const newParagraphId = addParagraph(index, text)
    setFocusParagraphId(newParagraphId)
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
        className="inline-block relative my-[1px]" // Reduced vertical margin
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
        />
        {paragraph.sentences.map((sentence, index) => (
          <React.Fragment key={sentence.id}>
            <DraggableSentence
              sentence={sentence}
              index={index}
              moveItem={moveSentenceWithinParagraph}
              onClick={() => handleSentenceClick(sentence.id, index)} // Updated to remove 'e'
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
  ])
  const [editingSentenceId, setEditingSentenceId] = useState<string | null>(null)
  const [focusedCursorSpaceId, setFocusedCursorSpaceId] = useState<string | null>(null)
  const [focusParagraphId, setFocusParagraphId] = useState<string | null>(null)

  const updateParagraph = (updatedParagraph: Paragraph) => {
    setParagraphs((prevParagraphs) =>
      prevParagraphs.map((p) => (p.id === updatedParagraph.id ? updatedParagraph : p))
    )
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
    return newParagraphId
  }

  useEffect(() => {
    if (focusParagraphId) {
      const paragraph = paragraphs.find(p => p.id === focusParagraphId)
      if (paragraph && paragraph.sentences.length > 0) {
        setFocusedCursorSpaceId(`${paragraph.id}-0`) // Reverted focus to cursor space 1
      }
      setFocusParagraphId(null)
    }
  }, [paragraphs, focusParagraphId])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-2xl mx-auto p-4">
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
          onEnter={(text) => addParagraph(0, text)}
          onFocus={() => setFocusedCursorSpaceId(`separator-before-first`)}
          isFocused={focusedCursorSpaceId === `separator-before-first`}
          isLast={false}
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
          />
        ))}
      </div>
    </DndProvider>
  )
}

export default InteractiveDocument