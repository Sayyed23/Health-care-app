import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar'; // Ensure SidebarProvider is correctly imported

// Removed incorrect function calls for GeistSans and GeistMono below

export const metadata: Metadata = {
  title: 'Zenith Wellbeing',
  description: 'Your companion for a healthier and more mindful life.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SidebarProvider defaultOpen>
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
