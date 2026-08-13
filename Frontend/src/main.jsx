import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.jsx';
import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Providers from './context/composeContext';
import { BrowserRouter } from 'react-router-dom';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Root() {
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  // Ensure <html> has the correct class on initial mount
  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorScheme]);

  const toggleColorScheme = (value) => {
    const nextColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(nextColorScheme);

    const root = document.documentElement;
    if (nextColorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider 
        theme={{ colorScheme }} 
        withGlobalStyles 
        withNormalizeCSS
      >
        <App />
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <Providers>
          <Root />
        </Providers>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);