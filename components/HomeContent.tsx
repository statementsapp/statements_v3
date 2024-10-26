'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import DocumentWithMessenger from '@/components/DocumentWithMessenger'
import { Switch } from "@/components/ui/switch"

export default function HomeContent() {
  const [isClassic, setIsClassic] = useState(true)

  const handleMessageClick = (messageId: string, type: 'sentence' | 'remark') => {
    console.log('Message clicked:', messageId, type)
  }

  const variants = {
    classic: { x: '0%' },
    new: { x: '-50%' }
  }

  return (
    <main className="min-h-screen bg-[#2b2e36] text-white relative overflow-hidden font-['Arial']">
      {/* Rest of the component code... */}
    </main>
  )
}
