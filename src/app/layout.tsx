// /src/app/layout.tsx - layout page

import './globals.css'
import Navbar from './_components/layout/navbar';
import { Providers } from './providers';
import SessionDebugger from './_components/SessionDebug';
import { debugLog } from "../utils/debug";
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SessionDebugger />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}