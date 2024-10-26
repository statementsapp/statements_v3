'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import DocumentWithMessenger from '@/components/DocumentWithMessenger'
import { Switch } from "@/components/ui/switch"

export default function Home() {
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
      <div className="absolute top-4 left-4 z-10 flex items-center">
        {/* <Image src="/assets/images/logo.png" alt="Logo" width={50} height={50} /> */}
        <div className="ml-4">
          <h1 className="text-5xl">Statements</h1>
          {/* <h2 className="text-2xl mt-1 ml-2">Write directly by chat</h2> */}
        </div>
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <span className={`text-sm ${isClassic ? 'font-bold' : ''}`}>Classic</span>
        <Switch
          id="version-toggle"
          checked={!isClassic}
          onCheckedChange={() => setIsClassic(!isClassic)}
        />
        <span className={`text-sm ${!isClassic ? 'font-bold' : ''}`}>New</span>
      </div>

      <div className="absolute inset-12 mt-8 rounded-lg overflow-hidden">
        <motion.div
          className="flex w-[200%] h-full"
          animate={isClassic ? 'classic' : 'new'}
          variants={variants}
          transition={{ type: 'tween', duration: 0.5 }}
        >
          <div className="w-1/2 h-full flex items-center justify-center">
            <div className="p-8 w-full max-w-4xl">
              <div className="aspect-w-16 aspect-h-9">
                <video 
                  className="w-full h-full object-cover rounded-lg"
          
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/assets/videos/AISafety.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          <div className="w-1/2 h-full">
            <DocumentWithMessenger onMessageClick={handleMessageClick} />
          </div>
        </motion.div>
      </div>
    </main>
  )
}
