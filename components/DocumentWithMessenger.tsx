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
  const [emphasizedSentenceType, setEmphasizedSentenceType] = useState<'sentence' | 'remark' | null>(null)

  const handleNewContent = useCallback(
    (text: string, sender: 'user' | 'ai', type: 'sentence' | 'remark', id: string, sentenceId?: string) => {
      const newMessage: Message = {
        id,
        text,
        sender,
        type,
        sentenceId: type === 'remark' ? sentenceId : id,
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
      console.log('New message added:', newMessage)
    },
    []
  )

  const handleNewMessage = useCallback(
    (text: string, emphasizedSentenceId: string | null, emphasizedMessageId: string | null, emphasizedType: 'sentence' | 'remark' | null) => {
      console.log('handleNewMessage called with:', {
        text,
        emphasizedSentenceId,
        emphasizedMessageId,
        emphasizedType
      });

      if (documentRef.current) {
        let newSentenceId: string | null = null;

        if (emphasizedType === 'sentence' && emphasizedSentenceId) {
          // Add the new sentence directly after the emphasized sentence
          newSentenceId = documentRef.current.addSentenceAfter(emphasizedSentenceId, text);
        } else if (emphasizedType === 'remark' && emphasizedSentenceId && emphasizedMessageId) {
          // Add a new paragraph after the emphasized sentence and mark the remark as rejoined
          console.log('Calling addParagraphAfterSentence with:', emphasizedSentenceId, text, emphasizedMessageId);
          newSentenceId = documentRef.current.addParagraphAfterSentence(emphasizedSentenceId, text, emphasizedMessageId);
        } else {
          // Add a new paragraph at the end if no sentence is emphasized
          console.log('Calling addParagraphAfterSentence with:', emphasizedSentenceId, text);
          newSentenceId = documentRef.current.addParagraphAfterSentence(emphasizedSentenceId, text);
        }

        if (newSentenceId) {
          // Add the new sentence to the messages state
          handleNewContent(text, 'user', 'sentence', newSentenceId);
          
          // Update the emphasized sentence
          setEmphasizedSentenceId(newSentenceId);
          setEmphasizedSentenceType('sentence');
          
          console.log('New sentence/paragraph added:', newSentenceId);
        } else {
          console.error('Failed to add new sentence/paragraph');
        }
      } else {
        console.error('documentRef is not available');
      }
    },
    [handleNewContent, setEmphasizedSentenceId, setEmphasizedSentenceType]
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
    if (messageId) {
      const emphasizedMessage = messages.find(message => message.id === messageId)
      if (emphasizedMessage) {
        setEmphasizedSentenceId(emphasizedMessage.sentenceId || null)
        setEmphasizedSentenceType(emphasizedMessage.type)
      }
    } else {
      setEmphasizedSentenceId(null)
      setEmphasizedSentenceType(null)
    }
  }, [messages])

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
            emphasizedSentenceId={emphasizedSentenceId}
            emphasizedSentenceType={emphasizedSentenceType}
          />
        </div>
        <div className="w-1/3 p-6 bg-black flex flex-col">
          <Messenger
            messages={messages}
            onNewMessage={(text) => handleNewMessage(text, emphasizedSentenceId, emphasizedMessageId, emphasizedSentenceType)}
            onMessageClick={handleMessageClickInternal}
            selectedMessageId={selectedMessageId}
            selectedMessageType={selectedMessageType}
            inputRef={inputRef}
            hoveredRemarkId={hoveredRemarkId}
            emphasizedMessageId={emphasizedMessageId}
            emphasizedSentenceId={emphasizedSentenceId}
            emphasizedSentenceType={emphasizedSentenceType}
          />
        </div>
      </div>
    </div>
  )
}