import type { Metadata, Viewport } from 'next';
import Toaster from '@/components/ui/Toaster';
import PWAInstaller from '@/components/ui/PWAInstaller';
import './globals.css';

export const metadata: Metadata = {
  title: 'COIN HUNTER // BANGKOK GRID',
  description: 'Cyber-hunter geo-guessing game · ตามล่าเหรียญลับใน Bangkok Grid',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CoinHunter' },
};

export const viewport: Viewport = {
  themeColor: '#0a0612',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      <body className="font-sans">
        {children}
        <Toaster />
        <PWAInstaller />
      </body>
    </html>
  );
}
