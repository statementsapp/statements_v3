'use client'

import dynamic from 'next/dynamic'

const InteractiveDocument = dynamic(() => import('./InteractiveDocument'), { ssr: false })

export default function InteractiveDocumentWrapper() {
  return <InteractiveDocument />
}