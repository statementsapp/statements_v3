'use client'

import React from 'react'
import DocumentWithMessenger from '@/components/DocumentWithMessenger'

export default function Home() {
  const handleMessageClick = (messageId: string, type: 'sentence' | 'remark') => {
    console.log('Message clicked:', messageId, type)
  }

  return (
    <main className="min-h-screen bg-[#2b2e36] text-white relative overflow-hidden font-['Arial']">
      <div className="absolute top-4 left-4 z-10 flex items-center">
        <div className="ml-4">
          <h1 className="text-5xl">Statements</h1>
        </div>
      </div>

      <div className="absolute inset-12 mt-8 rounded-lg overflow-hidden">
        <div className="h-full">
          <DocumentWithMessenger onMessageClick={handleMessageClick} />
        </div>
      </div>
    </main>
  )
}
