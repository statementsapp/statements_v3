import React, { useRef, useState, useEffect } from 'react'
import { Sentence } from './InteractiveDocument'

interface SentenceComponentProps {
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
}

const SentenceComponent: React.FC<SentenceComponentProps> = ({
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
  }, [isEditing, localText])

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
      {sentence.remarks.length > 0 && sentence.remarks.some(remark => !remark.rejoined) && (
        <span 
          className="text-white inline-block cursor-pointer" 
          style={{ verticalAlign: 'top', fontSize: '1em' }}
          onClick={handleRemarkClick}
          onMouseEnter={() => onRemarkMouseEnter(sentence.id)}
          onMouseLeave={onRemarkMouseLeave}
        >
          †
        </span>
      )}
    </span>
  )
}

export default SentenceComponent
