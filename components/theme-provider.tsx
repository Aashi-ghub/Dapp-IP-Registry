"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useEffect } from "react"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force dark mode only
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }, [])

  return (
    <NextThemesProvider 
      {...props} 
      defaultTheme="dark" 
      enableSystem={false} 
      enableColorScheme={true} 
      forcedTheme="dark"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

