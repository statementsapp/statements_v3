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
  const [hoveredRemarkId, setHoveredRemarkId] = useState<string | null>(null);
  const [emphasizedRemarkId, setEmphasizedRemarkId] = useState<string | null>(null)
  const [emphasizedSentenceId, setEmphasizedSentenceId] = useState<string | null>(null)
  const [emphasizedRemarkIds, setEmphasizedRemarkIds] = useState<{ [sentenceId: string]: string }>({})
  const [emphasizedMessageId, setEmphasizedMessageId] = useState<string | null>(null)

  const handleNewContent = useCallback(
    (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark', id: string, sentenceId?: string) => {
      const newMessage: Message = {
        id,
        text,
        sender,
        type,
        sentenceId: type === 'remark' ? sentenceId : undefined,
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
      console.log('New message added:', newMessage)
    },
    []
  )

  const handleNewMessage = useCallback(
    (text: string, emphasizedSentenceId: string | null, emphasizedMessageId: string | null) => {
      console.log('handleNewMessage called with:', {
        text,
        emphasizedSentenceId,
        emphasizedMessageId
      })
    },
    []
  )

  const handleNewResponse = useCallback(
    (
      text: string,
      respondingToId: string,
      respondingToType: 'sentence' | 'remark'
    ) => {
      if (documentRef.current) {
        const newRemarkId = documentRef.current.handleNewResponse(text, respondingToId, respondingToType);
        handleNewContent(text, 'ai', 'remark', newRemarkId);
      }
    },
    [handleNewContent]
  )

  const handleEmphasizeMessage = useCallback((messageId: string | null) => {
    setEmphasizedMessageId(messageId)
  }, [])

  const handleMessageClickInternal = useCallback((messageId: string, type: 'sentence' | 'remark') => {
    setSelectedMessageId(messageId)
    setSelectedMessageType(type)
    handleEmphasizeMessage(messageId)
    onMessageClick(messageId, type)
  }, [onMessageClick, handleEmphasizeMessage])

  const handleRemarkHover = useCallback((remarkId: string | null, remarkText: string | null) => {
    console.log('Remark ID:', remarkId)
    console.log('Remark hovered:', remarkText)  
    setHoveredRemarkId(remarkId);
  
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [])

  const handleEmphasizeRemark = useCallback((remarkId: string | null, sentenceId: string | null) => {
    setEmphasizedMessageId(remarkId)
    setEmphasizedSentenceId(sentenceId)
    if (sentenceId && remarkId) {
      setEmphasizedRemarkIds(prev => ({ ...prev, [sentenceId]: remarkId }))
    }
  }, [])

  const handleRemarkClick = useCallback((sentenceId: string) => {
    if (documentRef.current) {
      const nextRemarkId = documentRef.current.cycleEmphasizedRemark(sentenceId)
      console.log('Next remark ID:', nextRemarkId)
      if (nextRemarkId) {
        setHoveredRemarkId(nextRemarkId);
        setEmphasizedMessageId(nextRemarkId);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  }, [])

  const handleDocumentClick = useCallback((clickType: 'document' | 'sentence', sentenceId?: string) => {
    setEmphasizedMessageId(null)
    setHoveredRemarkId(null)
    
    if (clickType === 'sentence' && sentenceId) {
      // If a sentence was clicked, you might want to do something specific here
      // For example, you could set the selectedMessageId to the clicked sentence
      setSelectedMessageId(sentenceId)
      setSelectedMessageType('sentence')
    } else {
      // If it's a general document click, clear the selection
      setSelectedMessageId(null)
      setSelectedMessageType(null)
    }
  }, [])

  return (
    <div className="flex justify-center min-h-screen bg-black text-white">
      <div className="flex w-full max-w-7xl mx-auto">
        <div className="w-2/3 p-6 bg-black border-r border-gray-800 overflow-auto">
          <InteractiveDocument
            ref={documentRef}
            onNewContent={handleNewContent}
            onContentClick={(messageId: string, type: 'sentence' | 'remark') => {
              console.log('Content clicked:', messageId, type)
              handleEmphasizeMessage(messageId)
            }}
            onRemarkHover={handleRemarkHover}
            onNewResponse={handleNewResponse}
            onRemarkAction={(remarkId: string, action: string) => {
              console.log('Remark action:', remarkId, action);
            }}
            onEmphasizeRemark={handleEmphasizeRemark}
            onRemarkClick={handleRemarkClick}
            onDocumentClick={handleDocumentClick}
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
            hoveredRemarkId={hoveredRemarkId}
            emphasizedMessageId={emphasizedMessageId}
            emphasizedSentenceId={emphasizedSentenceId} // Add this prop
          />
        </div>
      </div>
    </div>
  )
}