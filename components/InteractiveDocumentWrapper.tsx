'use client'

import InteractiveDocument from './InteractiveDocument'

export default function InteractiveDocumentWrapper() {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <InteractiveDocument />
    </div>
  )
}