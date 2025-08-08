import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Track page views if analytics are set up
    const handleRouteChange = (url) => {
      // Future: Add analytics tracking here
      console.log('Route changed to:', url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;