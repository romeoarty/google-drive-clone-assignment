import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { FilesProvider } from '@/contexts/FilesContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Drive Clone - Your Personal Cloud Storage',
  description: 'A secure and modern cloud storage solution built with Next.js',
  keywords: ['cloud storage', 'file sharing', 'drive clone', 'file management'],
  authors: [{ name: 'Sora Union Engineering Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <FilesProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </FilesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}