import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SwRegister } from '../components/SwRegister'

const jakarta = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
      style: 'normal',
    },
  ],
  weight: '200 800',
  variable: '--font-jakarta',
  display: 'swap',
})

const inter = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
      style: 'normal',
    },
  ],
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
})

const title = 'Task Tango - tasks with rhythm'
const description =
  'Task Tango is a fast, beautiful to-do app with quick-add shortcuts, due dates, lists, subtasks, progress streaks and drag-and-drop. Works offline and installs like an app.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3400'),
  title,
  description,
  applicationName: 'Task Tango',
  icons: { icon: '/icon.svg', apple: '/icons/icon-192.png' },
  openGraph: {
    type: 'website',
    title,
    description: 'Plan your day at the speed of typing. Quick-add, lists, subtasks, streaks and a warm, focused design.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Task Tango' }],
  },
  twitter: { card: 'summary_large_image', title, images: ['/og.png'] },
}

export const viewport: Viewport = {
  themeColor: '#fff8f1',
  colorScheme: 'light dark',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}

// Applies the saved theme before first paint so there is no flash.
const themeScript = `try{var p=JSON.parse(localStorage.getItem('tasktango:prefs')||'{}');var d=p.theme==='dark'||((!p.theme||p.theme==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#17100d':'#fff8f1')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
