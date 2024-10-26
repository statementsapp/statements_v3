import type { AppProps } from 'next/app';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function fetchOpenAIKey() {
      const response = await fetch('/api/openai-key');
      const data = await response.json();
      (window as any).__NEXT_DATA__ = {
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
