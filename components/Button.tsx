import React from 'react'

interface ButtonProps {
  onClick: () => void
  className?: string
  children: React.ReactNode
}

export function Button({ onClick, className = '', children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
    >
      {children}
    </button>
  )
}