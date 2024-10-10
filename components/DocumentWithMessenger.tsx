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
  const [emphasizedMessageId, setEmphasizedMessageId] = useState<string | null>(null)

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
        const newSentenceId = `sentence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (emphasizedType === 'sentence' && emphasizedSentenceId) {
          console.log("addSentenceAfter with:", emphasizedSentenceId, text, newSentenceId)
          documentRef.current.addSentenceAfter(emphasizedSentenceId, text, newSentenceId);
        } else if (emphasizedType === 'remark' && emphasizedSentenceId) {
          console.log('addParagraphAfterSentence with:', emphasizedSentenceId, text, emphasizedMessageId, newSentenceId);
          documentRef.current.addParagraphAfterSentence(emphasizedSentenceId, text, emphasizedMessageId, newSentenceId);
          
          // Update the rejoined status of the remark
          if (emphasizedMessageId) {
            setMessages(prevMessages => prevMessages.map(msg => 
              msg.id === emphasizedMessageId ? { ...msg, rejoined: true } : msg
            ))
          }
        } else {
          console.log('ELSE addParagraphAfterSentence with:', emphasizedSentenceId, text, newSentenceId);
          documentRef.current.addParagraphAfterSentence(emphasizedSentenceId, text, undefined, newSentenceId);
        }

        handleNewContent(text, 'user', 'sentence', newSentenceId);
        
        // Reset emphasis after adding new content
        setEmphasizedMessageId(null);
        setSelectedMessageId(null);
        setSelectedMessageType(null);
        
        console.log('New sentence/paragraph added:', newSentenceId);
      } else {
        console.error('documentRef is not available');
      }
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
        const newRemarkId = documentRef.current.handleNewResponse(text, respondingToId, respondingToType);
        handleNewContent(text, 'ai', 'remark', newRemarkId);
        
        // If responding to a remark, mark it as rejoined
        if (respondingToType === 'remark') {
          console.log("Responding to remark", respondingToId)
          setMessages(prevMessages => prevMessages.map(msg => 
            msg.id === respondingToId ? { ...msg, rejoined: true } : msg
          ))
        }
      }
    },
    [handleNewContent]
  )

  const handleEmphasizeMessage = useCallback((messageId: string | null) => {
    setEmphasizedMessageId(messageId)
  }, [])

  const handleMessageClickInternal = useCallback((messageId: string, type: 'sentence' | 'remark') => {
    // Clear emphasis on all messages
    setEmphasizedMessageId(null)
    setHoveredRemarkId(null)

    // Set the new emphasis
    setSelectedMessageId(messageId)
    setSelectedMessageType(type)
    setEmphasizedMessageId(messageId)

    onMessageClick(messageId, type)

    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [onMessageClick])

  const handleRemarkHover = useCallback((remarkId: string | null, remarkText: string | null) => {
    console.log('Remark ID:', remarkId)
    console.log('Remark hovered:', remarkText)  
    setHoveredRemarkId(remarkId);
  
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [])

  const handleClearEmphasis = useCallback(() => {
    setEmphasizedMessageId(null);
    setHoveredRemarkId(null);
  }, []);

  const handleEmphasizeRemark = useCallback((remarkId: string | null, sentenceId: string | null) => {
    setEmphasizedMessageId(remarkId);
    // Scroll to the emphasized remark in the Messenger component
    const messageElement = document.querySelector(`[data-message-id="${remarkId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleRemarkClick = useCallback((sentenceId: string) => {
    if (documentRef.current) {
      const nextRemarkId = documentRef.current.cycleEmphasizedRemark(sentenceId);
      console.log('Next remark ID:', nextRemarkId);
      if (nextRemarkId) {
        handleEmphasizeRemark(nextRemarkId, sentenceId);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  }, [handleEmphasizeRemark])

  const handleDocumentClick = useCallback((clickType: 'document' | 'sentence', sentenceId?: string) => {
    // Always reset emphasis for any click in the document
    setEmphasizedMessageId(null)
    setHoveredRemarkId(null)
    setSelectedMessageId(null)
    setSelectedMessageType(null)
  }, [])

  const handleClearInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="flex justify-center h-screen bg-black text-white overflow-hidden">
      <div className="flex w-full max-w-7xl mx-auto">
        <div className="w-2/3 p-6 bg-black border-r border-gray-800 overflow-hidden">
          <InteractiveDocument
            ref={documentRef}
            onNewContent={handleNewContent}
            onContentClick={(messageId: string, type: 'sentence' | 'remark') => {
              console.log('Content clicked:', messageId, type)
              setEmphasizedMessageId(messageId)
            }}
            onRemarkHover={handleRemarkHover}
            onNewResponse={handleNewResponse}
            onRemarkAction={(remarkId: string, action: string) => {
              console.log('Remark action:', remarkId, action);
              if (action === 'rejoin') {
                setMessages(prevMessages => prevMessages.map(msg => 
                  msg.id === remarkId ? { ...msg, rejoined: true } : msg
                ))
              }
            }}
            onEmphasizeRemark={handleEmphasizeRemark}
            onClearEmphasis={handleClearEmphasis}
            onClearInput={handleClearInput}
            onRemarkClick={handleRemarkClick}
            onDocumentClick={handleDocumentClick}
            emphasizedMessageId={emphasizedMessageId}
            inputRef={inputRef}
          />
        </div>
        <div className="w-1/3 p-6 bg-black flex flex-col overflow-hidden">
          <Messenger
            messages={messages}
            onNewMessage={(text) => handleNewMessage(text, emphasizedMessageId, selectedMessageType)}
            onMessageClick={handleMessageClickInternal}
            selectedMessageId={selectedMessageId}
            selectedMessageType={selectedMessageType}
            inputRef={inputRef}
            hoveredRemarkId={hoveredRemarkId}
            emphasizedMessageId={emphasizedMessageId}
          />
        </div>
      </div>
    </div>
  )
}