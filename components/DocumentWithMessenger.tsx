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

  const handleNewContent = useCallback(
    (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark', id: string) => {
      const newMessage: Message = {
        id,
        text,
        sender,
        type,
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
      console.log('New message added:', newMessage)
    },
    []
  )

  const handleNewMessage = useCallback(
    (text: string) => {
      if (documentRef.current) {
        const newSentenceId = documentRef.current.addSentence(text);
        // The message is now created inside the addSentence function,
        // so we don't need to call handleNewContent here anymore.
      }
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

  const handleMessageClickInternal = useCallback((messageId: string, type: 'sentence' | 'remark') => {
    setSelectedMessageId(messageId)
    setSelectedMessageType(type)
    onMessageClick(messageId, type)
  }, [onMessageClick])

  const handleRemarkHover = useCallback((remarkId: string | null, remarkText: string | null) => {
    console.log('Remark ID:', remarkId)
    console.log('Remark hovered:', remarkText)  
    setHoveredRemarkId(remarkId);
  
    // Focus on the input when a remark is hovered
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [])

  const handleEmphasizeRemark = useCallback((remarkId: string | null, sentenceId: string | null) => {
    setEmphasizedRemarkId(remarkId)
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
        if (inputRef.current) {
          inputRef.current.focus();
        }
        // setEmphasizedRemarkId(nextRemarkId)
        // setEmphasizedSentenceId(sentenceId)
        // setEmphasizedRemarkIds(prev => ({ ...prev, [sentenceId]: nextRemarkId }))
      }
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
            }}
            onRemarkHover={handleRemarkHover}
            onNewResponse={handleNewResponse}
            onRemarkAction={(remarkId: string, action: string) => {
              console.log('Remark action:', remarkId, action);
            }}
            onEmphasizeRemark={handleEmphasizeRemark}
            onRemarkClick={handleRemarkClick}
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
            emphasizedRemarkId={emphasizedRemarkId}
            emphasizedSentenceId={emphasizedSentenceId}
          />
        </div>
      </div>
    </div>
  )
}