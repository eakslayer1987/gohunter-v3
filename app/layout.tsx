import type { Metadata, Viewport } from 'next';
import Toaster from '@/components/ui/Toaster';
import PWAInstaller from '@/components/ui/PWAInstaller';
import MobileNav from '@/components/ui/MobileNav';
import ThemeProvider from '@/components/ui/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'COIN HUNTER // BANGKOK GRID',
  description: 'Cyber-hunter geo-guessing game · ตามล่าเหรียญลับใน Bangkok Grid',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    // black-translucent = content paints up under the status bar; we
    // honour env(safe-area-inset-top) in CSS so chrome doesn't hide
    // behind it. Matches the cyber-purple base of the rest of the UI.
    statusBarStyle: 'black-translucent',
    title: 'CoinHunter',
  },
  // Default cover for share previews + iOS A2HS splash
  // (auto-generated). Falls through to /icons/icon-512.svg.
  openGraph: {
    title: 'COIN HUNTER // BANGKOK GRID',
    description: 'Cyber-hunter geo-guessing game in Bangkok',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#05030a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  /** iPhone Safari pulls layout under the notch when we opt in here.
   *  Combined with env(safe-area-inset-*) in CSS this gives a true
   *  edge-to-edge mobile feel without our chrome falling behind the
   *  notch or home indicator. */
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&family=Kanit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* iOS Safari ignores manifest icons — needs its own touch icon. */}
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="font-sans theme-cyan">
        <ThemeProvider />
        {children}
        <Toaster />
        <MobileNav />
        <PWAInstaller />
      </body>
    </html>
  );
}
