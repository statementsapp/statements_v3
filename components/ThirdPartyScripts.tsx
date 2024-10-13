import Script from 'next/script'

const ThirdPartyScripts = () => {
  return (
    <>
      {/* Add your third-party scripts here */}
      <Script
        src="https://example.com/script.js"
        strategy="afterInteractive"
      />
    </>
  )
}

export default ThirdPartyScripts
