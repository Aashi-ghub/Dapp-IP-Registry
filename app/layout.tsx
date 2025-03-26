import type React from "react"
import type { Metadata } from "next"
import { Quicksand } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Quicksand({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Decentralized IP Registry",
  description: "Register & protect your intellectual property on the Internet Computer Protocol",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" style={{colorScheme: 'dark'}} suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white`}>
        <ThemeProvider>
          <WalletProvider>{children}</WalletProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'