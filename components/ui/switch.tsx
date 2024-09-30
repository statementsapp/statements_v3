import React from 'react'

interface SwitchProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({ id, checked, onCheckedChange, className }) => {
  return (
    <label htmlFor={id} className={`relative inline-block w-10 h-6 ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="opacity-0 w-0 h-0"
      />
      <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 transition-all duration-300 rounded-full ${checked ? 'bg-green-500' : ''}`}>
        <span className={`absolute w-5 h-5 bg-white rounded-full transition-all duration-300 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </label>
  )
}