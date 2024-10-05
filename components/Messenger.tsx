import React, { useState, forwardRef } from 'react'

export interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  type: 'sentence' | 'remark'
}

interface MessengerProps {
  messages: Message[]
  onNewMessage: (text: string) => void
  onMessageClick: (messageId: string, type: 'sentence' | 'remark') => void
  selectedMessageId: string | null
  selectedMessageType: 'sentence' | 'remark' | null
  inputRef: React.RefObject<HTMLInputElement>
}

export function Messenger({
  messages,
  onNewMessage,
  onMessageClick,
  selectedMessageId,
  selectedMessageType,
  inputRef,
}: MessengerProps) {
  const [inputText, setInputText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      onNewMessage(inputText.trim())
      setInputText('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 mb-2 rounded cursor-pointer transition-all duration-200 ${
              message.sender === 'user' ? 'bg-gray-800 ml-auto' : 'bg-gray-700'
            } ${
              selectedMessageId === message.id && selectedMessageType === message.type
                ? 'border-2 border-blue-500'
                : ''
            }`}
            style={{ maxWidth: '80%' }}
            onClick={() => onMessageClick(message.id, message.type)}
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