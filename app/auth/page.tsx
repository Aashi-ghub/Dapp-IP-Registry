"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { useWallet } from "@/components/wallet-provider"
import { Fingerprint } from "lucide-react"

export default function AuthPage() {
  const { isConnected, connect } = useWallet()
  const router = useRouter()

  // Redirect if already connected
  useEffect(() => {
    if (isConnected) {
      router.push("/register")
    }
  }, [isConnected, router])

  const handleConnect = async () => {
    await connect()
    router.push("/register")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full p-8 glass-card rounded-lg">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Fingerprint className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Sign in to Secure Your Work</h1>
            <p className="text-muted-foreground">
              Connect with Internet Identity to register and manage your intellectual property
            </p>
            <Button size="lg" className="w-full" onClick={handleConnect}>
              Connect Wallet (Internet Identity)
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

