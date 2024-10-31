import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

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
  onInput: (text: string) => void;
  onReset: () => void;
  content: string;
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
  onInput,
  onReset,
  content
}, ref) => {
  const inputRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

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
      // e.preventDefault();
      
      // invertPrecedingSentenceColors();
    }
  };

  const invertPrecedingSentenceColors = () => {
    if (containerRef.current) {
      const precedingSentence = containerRef.current.previousElementSibling as HTMLElement;
      if (precedingSentence) {
        const currentColor = window.getComputedStyle(precedingSentence).color;
        precedingSentence.style.color = 'black';
        precedingSentence.style.backgroundColor = currentColor;
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
