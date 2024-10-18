import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';

interface CursorSpaceProps {
  id: string;
  onEnter: (text: string) => void;
  onFocus: () => void;
  isFocused: boolean;
  isFirst: boolean;
  isLast: boolean;
  showSolidCursor: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  isSeparator?: boolean;
  isDisabled: boolean;
  remarks?: string[];
  remarkColor?: string;
  isRemarkCursor?: boolean;
  isRemarkExpanded?: boolean;
  isRemarkHovered?: boolean;
  isRemarkEditing?: boolean;
  onInput: (text: string) => void;
  onReset: () => void;
  content: string;
  onDeleteSentence: (sentenceId: string, remarks: string[]) => void;
  sentenceId: string;
}

export const CursorSpace = forwardRef<
  { resetContent: () => void; invertPrecedingSentenceColors: () => void },
  CursorSpaceProps
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
  content,
  onDeleteSentence,
  sentenceId
}, ref) => {
  const inputRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isInverted, setIsInverted] = useState(false);
  const [originalColors, setOriginalColors] = useState<{ color: string; backgroundColor: string } | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.textContent = content;
      // Move cursor to the end of the content
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(inputRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && content.trim() !== '') {
      e.preventDefault();
      onEnter(content);
      if (inputRef.current) {
        inputRef.current.textContent = '';
      }
    } else if (e.key === 'Backspace' && content.trim() === '' && !isSeparator) {
      e.preventDefault();
      
      if (isInverted) {
        initiateSentenceDeletion();
      } else {
        invertPrecedingSentenceColors();
      }
    }
  };

  const invertPrecedingSentenceColors = () => {
    if (containerRef.current) {
      const precedingSentence = containerRef.current.previousElementSibling as HTMLElement;
      if (precedingSentence) {
        const currentColor = window.getComputedStyle(precedingSentence).color;
        const currentBgColor = window.getComputedStyle(precedingSentence).backgroundColor;
        
        setOriginalColors({ color: currentColor, backgroundColor: currentBgColor });
        
        precedingSentence.style.color = 'black';
        precedingSentence.style.backgroundColor = currentColor;
        setIsInverted(true);
      }
    }
  };

  const resetInvertedColors = () => {
    if (containerRef.current && isInverted) {
      const precedingSentence = containerRef.current.previousElementSibling as HTMLElement;
      if (precedingSentence && originalColors) {
        precedingSentence.style.color = originalColors.color;
        precedingSentence.style.backgroundColor = originalColors.backgroundColor;
        setIsInverted(false);
        setOriginalColors(null);
      }
    }
  };

  const initiateSentenceDeletion = () => {
    if (containerRef.current) {
      const precedingSentence = containerRef.current.previousElementSibling as HTMLElement;
      if (precedingSentence) {
        // Remove the preceding sentence from the DOM
        precedingSentence.remove();
        
        // Call the onDeleteSentence prop with the sentence ID and remarks
        onDeleteSentence(sentenceId, remarks);
        
        // Reset the inverted colors state
        setIsInverted(false);
        setOriginalColors(null);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const newText = e.currentTarget.textContent || '';
    onInput(newText);
  };

  const resetContent = () => {
    if (inputRef.current) {
      inputRef.current.textContent = '';
    }
    onReset();
  };

  useImperativeHandle(ref, () => ({
    resetContent,
    invertPrecedingSentenceColors
  }));

  useEffect(() => {
    // Reset inverted colors on clickaway
    const handleClickAway = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        resetInvertedColors();
      }
    };

    document.addEventListener('mousedown', handleClickAway);

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [isInverted]);

  return (
    <span 
      ref={containerRef}
      id={id}
      className={`inline ${isFirst ? '' : 'ml-[0.2em]'} ${isLast ? 'mr-0' : ''} ${isSeparator ? 'w-full' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <span
        ref={inputRef}
        contentEditable={!isDisabled}
        suppressContentEditableWarning
        spellCheck={false}
        className={`inline min-w-[1ch] outline-none ${
          isFocused ? 'bg-transparent' : ''
        } ${isSeparator ? 'w-full' : ''} pl-[0.3em]`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
      >
        {content}
      </span>
      {showSolidCursor && !isFocused && <span className="cursor">|</span>}
    </span>
  );
});

CursorSpace.displayName = 'CursorSpace';
