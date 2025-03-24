"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-provider"
import { AnimatedBackground } from "@/components/animated-background"
import { Footer } from "@/components/footer"
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react"

export default function AuthPage() {
  const { isConnected, connect, isConnecting, error } = useWallet()
  const router = useRouter()

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard")
    }
  }, [isConnected, router])

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
          <div className="glass-card p-8 md:p-12 rounded-lg max-w-md mx-auto">
            <div className="space-y-6 text-center">
              <div className="p-3 mx-auto rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                {isConnected ? (
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <h1 className="text-3xl font-bold">Secure Your Intellectual Property</h1>
              
              <p className="text-muted-foreground">
                Connect with Internet Identity to register and protect your work on the blockchain
              </p>
              
              {error && (
                <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button 
                className="w-full py-6 text-lg" 
                onClick={connect} 
                disabled={isConnecting || isConnected}
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </span>
                ) : isConnected ? (
                  <span className="flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Connected
                  </span>
                ) : (
                  "Connect with Internet Identity"
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                By connecting, you'll be able to register, verify, and manage intellectual property on the Internet Computer blockchain
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

