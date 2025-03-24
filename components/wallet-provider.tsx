"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { icAgent } from "@/lib/ic-agent"

type WalletContextType = {
  isConnected: boolean
  principalId: string | null
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  error: string | null
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  principalId: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  error: null
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [isConnected, setIsConnected] = useState(false)
  const [principalId, setPrincipalId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check authentication status initially and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsInitializing(true)
        console.log("Checking authentication status...")
        
        // Check if authenticated with agent
        const isAuth = await icAgent.isAuthenticated()
        console.log("Authentication status:", isAuth)
        
        // Get stored principal
        const storedPrincipal = typeof window !== 'undefined' 
          ? localStorage.getItem("principalId") 
          : null
        
        if (isAuth && storedPrincipal) {
          // User is authenticated and we have their principal
          console.log("User is authenticated with principal:", storedPrincipal)
          setIsConnected(true)
          setPrincipalId(storedPrincipal)
          setError(null)
        } else {
          // User is not authenticated or we don't have their principal
          console.log("User is not authenticated or principal is missing")
          setIsConnected(false)
          setPrincipalId(null)
          
          // Clean up localStorage if needed
          if (typeof window !== 'undefined' && !isAuth && storedPrincipal) {
            console.log("Removing stale principal from storage")
            localStorage.removeItem("principalId")
          }
        }
      } catch (err) {
        console.error("Error checking authentication:", err)
        setIsConnected(false)
        setPrincipalId(null)
      } finally {
        setIsInitializing(false)
      }
    }
    
    // Run the check
    checkAuthStatus()
    
    // Set up storage event listener for cross-tab synchronization
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "principalId") {
        console.log("Principal ID changed in another tab, refreshing...")
        checkAuthStatus()
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener("storage", handleStorageChange)
    }
    
    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [])
  
  // Connect wallet
  const connect = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      console.log("Starting wallet connection...")
      
      // Attempt login
      const principal = await icAgent.login()
      
      if (principal) {
        // Login successful
        console.log("Connection successful with principal:", principal)
        setIsConnected(true)
        setPrincipalId(principal)
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("principalId", principal)
        }
      } else {
        // Login failed
        console.error("Connection failed: No principal returned")
        setIsConnected(false)
        setPrincipalId(null)
        setError("Failed to connect wallet. Please try again.")
        
        // Clean up localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem("principalId")
        }
      }
    } catch (err) {
      // Handle error
      console.error("Error connecting wallet:", err)
      setIsConnected(false)
      setPrincipalId(null)
      setError("An error occurred while connecting: " + String(err))
      
      // Clean up localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("principalId")
      }
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Disconnect wallet
  const disconnect = async () => {
    try {
      console.log("Disconnecting wallet...")
      
      // Logout from agent
      await icAgent.logout()
      
      // Update state
      setIsConnected(false)
      setPrincipalId(null)
      setError(null)
      
      // Clean up localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("principalId")
      }
      
      console.log("Wallet disconnected successfully")
    } catch (err) {
      console.error("Error disconnecting wallet:", err)
      
      // Force disconnect state even if there was an error
      setIsConnected(false)
      setPrincipalId(null)
      
      // Clean up localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("principalId")
      }
      
      setError("Error during logout: " + String(err))
    }
  }

  return (
    <WalletContext.Provider 
      value={{ 
        isConnected, 
        principalId, 
        connect, 
        disconnect, 
        isConnecting,
        error 
      }}
    >
      {!isInitializing && children}
    </WalletContext.Provider>
  )
}

