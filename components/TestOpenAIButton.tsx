'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'

interface TestOpenAIButtonProps {
  testOpenAI: () => Promise<{ success: boolean; response?: string; error?: string }>
}

export default function TestOpenAIButton({ testOpenAI }: TestOpenAIButtonProps) {
  const [state, formAction] = useFormState(testOpenAI, null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    await formAction()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <button 
        type="submit"
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test OpenAI'}
      </button>
      {state?.success && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
          Success: {state.response}
        </div>
      )}
      {state?.error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {state.error}
        </div>
      )}
    </form>
  )
}
