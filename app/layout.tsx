import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { config } from '@/config/flagskool.config';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { DevStateProvider } from '@/components/dev/DevStateProvider';
import { DevStateSwitcherMount } from '@/components/DevStateSwitcherMount';
import './globals.css';

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('flagskool_theme');
      if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

// Self-hosted via next/font so the fonts are not a render-blocking
// third-party request on Slow 4G. `display: swap` keeps text visible.
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const title = `${config.org.name} — Master AI Engineering & Automation`;
const description =
  'A practical AI engineering and automation school designed for Nigerian students and builders.';

// Traffic arrives from Telegram and X. Neither crawler runs JavaScript, so
// these tags must be server-rendered into the initial HTML.
export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: config.org.name,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    site: config.org.xHandle,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-ink-deep font-sans text-body-text antialiased selection:bg-flag-red selection:text-paper-soft">
        <ThemeProvider>
          <DevStateProvider>
            {children}
            <DevStateSwitcherMount />
          </DevStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
