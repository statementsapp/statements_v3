import Script from 'next/script'

const CustomScript = ({ src, ...props }) => (
  <Script
    src={src}
    strategy="afterInteractive"
    {...props}
  />
)

export default CustomScript
