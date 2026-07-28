import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import { MantineProvider } from '@mantine/core';
import Providers from './context/composeContext';
import { BrowserRouter } from 'react-router-dom'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
     <Providers>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <App />
        </MantineProvider>
    </Providers>
    </BrowserRouter>
  </StrictMode>,
)
