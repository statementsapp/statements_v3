'use client'

import React from 'react'
import DocumentWithMessenger from '@/components/DocumentWithMessenger'

export default function Home() {
  const handleMessageClick = (messageId: string, type: 'sentence' | 'remark') => {
    console.log('Message clicked:', messageId, type)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <DocumentWithMessenger onMessageClick={handleMessageClick} />
    </main>
  )
}