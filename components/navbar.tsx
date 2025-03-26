"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWallet } from "@/components/wallet-provider"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, Search, FileText, AlertTriangle, Coins, Home, FileCheck, Loader2 } from "lucide-react"
import { CopyToClipboard } from "@/components/copy-to-clipboard"

export function Navbar() {
  const { isConnected, principalId, disconnect, connect, isConnecting } = useWallet()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", path: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "Register", path: "/register", icon: <FileCheck className="h-4 w-4 mr-2" /> },
    { name: "Verify", path: "/verify", icon: <Search className="h-4 w-4 mr-2" /> },
  ]

  if (isConnected) {
    navItems.push({ name: "Dashboard", path: "/dashboard", icon: <FileText className="h-4 w-4 mr-2" /> })
    navItems.push({ name: "Explorer", path: "/explorer", icon: <Coins className="h-4 w-4 mr-2" /> })
    navItems.push({ name: "Disputes", path: "/disputes", icon: <AlertTriangle className="h-4 w-4 mr-2" /> })
  }

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <nav style={{
      backgroundColor: "transparent",
      backdropFilter: "blur(8px)",
    }}
    className="fixed top-0 w-full z-50">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <span className="text-xl font-bold bg-clip-text text-white transition-all duration-300 group-hover:scale-105">
              IP Registry
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-white/10 flex items-center ${
                pathname === item.path 
                  ? "text-white bg-white/10" 
                  : "text-white hover:white/20"
              }`}
            >
              <span className="block">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
              <CopyToClipboard
                text={principalId || ""}
                displayText={principalId ? `${principalId.substring(0, 5)}...${principalId.substring(principalId.length - 5)}` : ""}
                className="text-xs text-muted-foreground hover:text-foreground"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={disconnect}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="rounded-full bg-white text-black px-4 hover-lift"
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex flex-col p-6 md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              IP Registry
            </span>
          </Link>
          <button 
            className="p-2 rounded-full hover:bg-muted transition-colors" 
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`p-3 rounded-lg hover:bg-muted flex items-center transition-colors ${
                pathname === item.path 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-foreground/80"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="mt-auto pt-6 border-t border-border/30">
          {isConnected ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Connected as:</span>
                <CopyToClipboard
                  text={principalId || ""}
                  displayText={principalId ? `${principalId.substring(0, 5)}...${principalId.substring(principalId.length - 5)}` : ""}
                  className="p-1.5 bg-muted rounded-md text-xs"
                />
              </div>
              <Button
                variant="outline"
                className="w-full justify-start rounded-lg"
                onClick={() => {
                  disconnect()
                  setIsMenuOpen(false)
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="w-full rounded-lg"
              onClick={() => {
                connect()
                setIsMenuOpen(false)
              }}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}

