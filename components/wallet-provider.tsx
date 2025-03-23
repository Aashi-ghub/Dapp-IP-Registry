"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type WalletContextType = {
  isConnected: boolean
  principalId: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  principalId: null,
  connect: async () => {},
  disconnect: () => {},
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [principalId, setPrincipalId] = useState<string | null>(null)

  // Check if user is already connected
  useEffect(() => {
    const storedPrincipalId = localStorage.getItem("principalId")
    if (storedPrincipalId) {
      setIsConnected(true)
      setPrincipalId(storedPrincipalId)
    }
  }, [])

  const connect = async () => {
    try {
      // In a real implementation, this would connect to Internet Identity
      // For demo purposes, we'll simulate a successful connection
      const mockPrincipalId = "2vxsx-fae"
      setIsConnected(true)
      setPrincipalId(mockPrincipalId)
      localStorage.setItem("principalId", mockPrincipalId)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setPrincipalId(null)
    localStorage.removeItem("principalId")
  }

  return (
    <WalletContext.Provider value={{ isConnected, principalId, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

