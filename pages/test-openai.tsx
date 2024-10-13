import { useState } from 'react';

export default function TestOpenAI() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testOpenAI = async () => {
    try {
      const response = await fetch('/api/test-openai');
      const data = await response.json();
      if (data.success) {
        setResult(data.response);
        setError(null);
      } else {
        setError(data.error);
        setResult(null);
      }
    } catch (err) {
      setError('Failed to fetch: ' + (err instanceof Error ? err.message : String(err)));
      setResult(null);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Test OpenAI Connection</h1>
      <button 
        onClick={testOpenAI}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Test OpenAI
      </button>
      {result && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
          Success: {result}
        </div>
      )}
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
