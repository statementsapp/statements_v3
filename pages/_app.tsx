import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import type { NEXT_DATA } from 'next/dist/shared/lib/utils';

// Extend the existing NEXT_DATA interface
declare global {
  interface Window {
    __NEXT_DATA__: NEXT_DATA & {
      props?: {
        pageProps: {
          openaiKey: string
        }
      }
    }
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function fetchOpenAIKey() {
      const response = await fetch('/api/openai-key');
      const data: { openaiKey: string } = await response.json();
      
      // Extend the window object
      if (window.__NEXT_DATA__) {
        window.__NEXT_DATA__.props = {
          ...window.__NEXT_DATA__.props,
          pageProps: {
            ...window.__NEXT_DATA__.props?.pageProps,
            openaiKey: data.openaiKey,
          },
        };
      }
    }
    fetchOpenAIKey();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
