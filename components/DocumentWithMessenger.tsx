'use client'

import React, { useState, useRef, useCallback } from 'react'
import InteractiveDocument from './InteractiveDocument'
import { Messenger, Message } from './Messenger'

interface DocumentWithMessengerProps {
  onMessageClick: (messageId: string, type: 'sentence' | 'remark') => void
}

export default function DocumentWithMessenger({
  onMessageClick,
}: DocumentWithMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [selectedMessageType, setSelectedMessageType] = useState<'sentence' | 'remark' | null>(null)
  const documentRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleNewContent = useCallback(
    (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark') => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: type === 'sentence' ? 'user' : 'ai', // 'sentence' on right, 'remark' on left
        type,
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
      console.log('New message added:', newMessage) // Add this line for debugging
    },
    []
  )

  const handleNewMessage = useCallback(
    (text: string) => {
      handleNewContent(text, 'user', 'sentence')
    },
    [handleNewContent]
  )

  const handleNewResponse = useCallback(
    (
      text: string,
      respondingToId: string,
      respondingToType: 'sentence' | 'remark'
    ) => {
      if (documentRef.current) {
        documentRef.current.handleNewResponse(text, respondingToId, respondingToType)
      }
      handleNewContent(text, 'ai', respondingToType)
    },
    [handleNewContent]
  )

  const handleMessageClickInternal = useCallback((messageId: string, type: 'sentence' | 'remark') => {
    setSelectedMessageId(messageId)
    setSelectedMessageType(type)
    onMessageClick(messageId, type)
  }, [onMessageClick])

  return (
    <div className="flex justify-center min-h-screen bg-black text-white">
      <div className="flex w-full max-w-7xl mx-auto">
        <div className="w-2/3 p-6 bg-black border-r border-gray-800 overflow-auto">
          <InteractiveDocument
            ref={documentRef}
            onNewContent={handleNewContent}
            onContentClick={(messageId: string, type: 'sentence' | 'remark') => {
              console.log('Content clicked:', messageId, type)
            }}
            onNewResponse={handleNewResponse}
          />
        </div>
        <div className="w-1/3 p-6 bg-black flex flex-col">
          <Messenger
            messages={messages}
            onNewMessage={handleNewMessage}
            onMessageClick={handleMessageClickInternal}
            selectedMessageId={selectedMessageId}
            selectedMessageType={selectedMessageType}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  )
}