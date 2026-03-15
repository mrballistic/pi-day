import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/theme/theme'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const APP_URL = 'https://pi-day-seven.vercel.app'
const TITLE = 'Find Your Birthday in π'
const DESCRIPTION =
  'Every birthday is hiding somewhere in the infinite digits of pi. Enter yours and watch a live scan through 1,000,000 digits to find exactly where you appear.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: '%s | Pi Birthday Finder',
  },
  description: DESCRIPTION,
  keywords: [
    'pi day',
    'birthday in pi',
    'find birthday in pi',
    'pi digits',
    'pi day activity',
    'math fun',
    '3.14',
    'pi birthday finder',
  ],
  authors: [{ name: 'Pi Birthday Finder' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Pi Birthday Finder',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
