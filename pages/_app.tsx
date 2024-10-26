import type { AppProps } from 'next/app';
import { useEffect } from 'react';

// Define a type for the window object extension
interface CustomWindow extends Window {
  __NEXT_DATA__?: {
    props: {
      pageProps: {
        openaiKey: string
      }
    }
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function fetchOpenAIKey() {
      const response = await fetch('/api/openai-key');
      const data: { openaiKey: string } = await response.json();
      
      // Use the custom window type
      ;(window as CustomWindow).__NEXT_DATA__ = {
        props: {
          pageProps: {
            openaiKey: data.openaiKey,
          },
        },
      };
    }
    fetchOpenAIKey();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
