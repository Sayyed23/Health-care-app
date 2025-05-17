"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes'; // Assuming next-themes is or will be installed

// Placeholder for Theme Toggler if next-themes is not used.
// For now, we'll mock useTheme if it's not fully set up.
const useThemeMock = () => {
  return {
    theme: 'light',
    setTheme: (theme: string) => console.log(`Theme set to ${theme}`),
  };
};

export function MainHeader({ title }: { title: string }) {
  // Attempt to use next-themes, fallback to mock if it's not setup in the project for now
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (e) {
    themeContext = useThemeMock();
  }
  const { theme, setTheme } = themeContext;


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <h1 className="text-xl font-semibold ml-2 md:ml-0">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button - Placeholder if next-themes is not installed */}
          {/* For a real app, install and configure next-themes: npm install next-themes */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          {/* Add other header items like notifications or user profile dropdown here */}
        </div>
      </div>
    </header>
  );
}

// To make this work properly, you would need to:
// 1. npm install next-themes
// 2. Wrap your app in <ThemeProvider attribute="class" defaultTheme="system" enableSystem> in src/app/layout.tsx or a client component provider.
// For now, this is a simplified version.
// If next-themes is already installed and configured, remove the try-catch and mock.
