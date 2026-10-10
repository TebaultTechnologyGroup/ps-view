import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router-dom"
import {router} from "./routes.ts"
import { MantineProvider } from '@mantine/core';
import "./i18n";
import { AppProvider } from "./guards/AppContext.tsx";
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import './index.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
    <MantineProvider>
      <RouterProvider router={router}/>
    </MantineProvider>
    </AppProvider>
  </StrictMode>,
)

