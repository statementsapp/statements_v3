import React, { useState, useCallback, useEffect } from 'react'

export type Message = {
  id: string
  text: string
  sender: 'user' | 'ai'
  type: 'sentence' | 'remark'
  sentenceId?: string // Change this to be optional
}

interface MessengerProps {
  messages: Message[]
  onNewMessage: (text: string, emphasizedSentenceId: string | null, emphasizedMessageId: string | null, emphasizedType: 'sentence' | 'remark' | null) => void
  onMessageClick: (messageId: string, type: 'sentence' | 'remark') => void
  selectedMessageId: string | null
  selectedMessageType: 'sentence' | 'remark' | null
  inputRef: React.RefObject<HTMLInputElement>
  hoveredRemarkId: string | null
  emphasizedMessageId: string | null
  emphasizedSentenceId: string | null // Add this prop
  emphasizedSentenceType: 'sentence' | 'remark' | null
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
  emphasizedSentenceId, // Add this prop
  emphasizedSentenceType,
}: MessengerProps) {
  const [inputText, setInputText] = useState('')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  // New useEffect to log new message IDs
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      console.log('New message received. ID:', latestMessage.id);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      console.log("emphasized message Id: ", emphasizedMessageId)
      console.log("emphasized sentence id: ", emphasizedSentenceId)
      console.log("emphasized sentence type: ", emphasizedSentenceType)
      onNewMessage(inputText.trim(), emphasizedSentenceId, emphasizedMessageId, emphasizedSentenceType)
      setInputText('')
    }
  }

  const handleMessageClick = useCallback((messageId: string, type: 'sentence' | 'remark') => {
    onMessageClick(messageId, type)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [onMessageClick, inputRef])

  const isMessageEmphasized = (messageId: string) => 
    emphasizedMessageId === messageId || hoveredRemarkId === messageId

  const shouldDimMessage = (messageId: string) =>
    (emphasizedMessageId !== null || hoveredRemarkId !== null) && !isMessageEmphasized(messageId)

  return (
    <div className="flex flex-col h-full messenger-container">
      <div className="flex-grow overflow-auto pb-4">
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className={`p-2 mb-2 rounded cursor-pointer transition-all duration-200 ${
              message.sender === 'user' ? 'bg-gray-800 ml-auto' : 'bg-gray-700'
            } ${
              hoveredMessageId === message.id ? 'bg-opacity-80' : ''
            } ${
              isMessageEmphasized(message.id)
                ? 'border-2 border-white bg-opacity-100'
                : shouldDimMessage(message.id)
                ? 'opacity-50'
                : ''
            }`}
            style={{
              maxWidth: '80%',
              boxShadow: hoveredRemarkId === message.id ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
            }}
            onClick={() => handleMessageClick(message.id, message.type)}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 sticky bottom-0 bg-black pt-2 pb-4">
        <form onSubmit={handleSubmit} className="flex">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-gray-800 text-white border border-gray-700 rounded p-2"
          />
        </form>
      </div>
    </div>
  )
}