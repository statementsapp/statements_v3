import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

export type Message = {
  id: string
  text: string
  sender: 'user' | 'ai'
  type: 'sentence' | 'remark'
  sentenceId?: string
  rejoined?: boolean
  shouldScroll?: boolean  // New flag to indicate if we should scroll to this message
}

interface MessengerProps {
  messages: Message[]
  onNewMessage: (text: string, emphasizedMessageId: string | null, emphasizedType: 'sentence' | 'remark' | null) => void
  onMessageClick: (messageId: string, type: 'sentence' | 'remark') => void
  selectedMessageId: string | null
  selectedMessageType: 'sentence' | 'remark' | null
  inputRef: React.RefObject<HTMLTextAreaElement>
  hoveredRemarkId: string | null
  emphasizedMessageId: string | null
}

export function Messenger({
  messages,
  onNewMessage,
  onMessageClick,
  selectedMessageId,
  selectedMessageType,
  inputRef,
  hoveredRemarkId,
  emphasizedMessageId,
}: MessengerProps) {
  const [inputText, setInputText] = useState('')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      onNewMessage(inputText.trim(), selectedMessageId, selectedMessageType)
      setInputText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleMessageClick = useCallback((messageId: string, type: 'sentence' | 'remark', rejoined: boolean) => {
    if (!rejoined) {
      onMessageClick(messageId, type)
    }
  }, [onMessageClick])

  const isMessageEmphasized = (messageId: string, rejoined: boolean) => 
    !rejoined && emphasizedMessageId === messageId

  const shouldDimMessage = (messageId: string, rejoined: boolean) =>
    rejoined || (emphasizedMessageId !== null && !isMessageEmphasized(messageId, rejoined))

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
    adjustScroll()
  }

  const adjustScroll = useCallback(() => {
    if (messageContainerRef.current && textareaRef.current && emphasizedMessageId) {
      const emphasizedMessage = messageContainerRef.current.querySelector(`[data-message-id="${emphasizedMessageId}"]`)
      if (emphasizedMessage) {
        const containerRect = messageContainerRef.current.getBoundingClientRect()
        const messageRect = emphasizedMessage.getBoundingClientRect()
        const textareaRect = textareaRef.current.getBoundingClientRect()

        if (messageRect.bottom > containerRect.bottom - textareaRect.height) {
          const scrollAmount = messageRect.bottom - (containerRect.bottom - textareaRect.height) + 20 // 20px extra for padding
          messageContainerRef.current.scrollTop += scrollAmount
        }
      }
    }
  }, [emphasizedMessageId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      adjustScroll()
    }
  }, [inputText, adjustScroll])

  useEffect(() => {
    adjustScroll()
  }, [emphasizedMessageId, adjustScroll])

  // New useEffect to scroll to the latest message if it should be scrolled to
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.shouldScroll && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full messenger-container">
      <div ref={messageContainerRef} className="flex-grow overflow-auto pb-4">
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            data-message-id={message.id}
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`p-2 mb-2 rounded transition-all duration-200 ${
              message.sender === 'user' ? 'bg-gray-800 ml-auto' : 'bg-gray-700'
            } ${
              hoveredMessageId === message.id && !message.rejoined ? 'bg-opacity-80' : ''
            } ${
              isMessageEmphasized(message.id, message.rejoined ?? false)
                ? 'border-2 border-white bg-opacity-100'
                : shouldDimMessage(message.id, message.rejoined ?? false)
                ? 'opacity-50'
                : ''
            } ${
              message.rejoined ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={{
              maxWidth: '80%',
              boxShadow: isMessageEmphasized(message.id, message.rejoined ?? false) ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
            }}
            onClick={() => handleMessageClick(message.id, message.type, message.rejoined ?? false)}
            onMouseEnter={() => !message.rejoined && setHoveredMessageId(message.id)}
            onMouseLeave={() => !message.rejoined && setHoveredMessageId(null)}
          >
            <div className="flex items-center justify-between">
              <span className={message.rejoined ? 'text-gray-500' : ''}>{message.text}</span>
              {message.type === 'remark' && message.rejoined && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Check className="h-4 w-4 text-gray-400 ml-2" />
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 sticky bottom-0 bg-black pt-2 pb-4">
        <form onSubmit={handleSubmit} className="flex">
          <textarea
            ref={(el) => {
              textareaRef.current = el
              if (inputRef) {
                inputRef.current = el
              }
            }}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            className="flex-grow bg-gray-800 text-white border border-gray-700 rounded p-2 resize-none overflow-hidden"
            style={{ minHeight: '40px', maxHeight: '200px' }}
            rows={1}
          />
        </form>
      </div>
    </div>
  )
}