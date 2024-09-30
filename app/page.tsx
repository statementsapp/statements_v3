import InteractiveDocument from '@/components/InteractiveDocument'

export default function Home() {
  const sampleContent = "This is a sample interactive document. It demonstrates paragraph separation and cursor spaces."

  return (
    <main className="min-h-screen">
      <InteractiveDocument content={sampleContent} />
    </main>
  )
}