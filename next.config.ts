import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'
// Local emulators are allowed in dev, or when a build is explicitly made against them.
const emulator = isDev || process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'
const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'toolkit-61554.firebaseapp.com'

const firebaseConnect = [
  'https://firestore.googleapis.com',
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
  'https://www.googleapis.com',
  'https://firebaseinstallations.googleapis.com',
]


const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://apis.google.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google.com/images/cleardot.gif",
  "font-src 'self' data:",
  `connect-src 'self' ${firebaseConnect.join(' ')}${emulator ? ' http://127.0.0.1:9199 http://127.0.0.1:8180 http://localhost:9199 http://localhost:8180 ws://localhost:* ws://127.0.0.1:*' : ''}`,
  `frame-src https://${authHost}${emulator ? " http://127.0.0.1:9199 http://localhost:9199" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
