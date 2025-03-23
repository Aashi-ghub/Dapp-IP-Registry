import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simulate file hash generation
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve) => {
    // In a real app, we would use crypto APIs to generate a real hash
    // This is just a simulation
    const reader = new FileReader()
    reader.onload = () => {
      // Generate a mock hash based on file name and size
      const mockHash = Array.from(file.name + file.size.toString())
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        .toString(16)
        .padStart(64, "0")

      // Simulate network delay
      setTimeout(() => {
        resolve(mockHash)
      }, 1000)
    }
    reader.readAsArrayBuffer(file)
  })
}

// Simulate blockchain registration
export async function registerOnBlockchain(hash: string, metadata: any): Promise<string> {
  return new Promise((resolve) => {
    // In a real app, this would call the ICP canister
    // This is just a simulation
    setTimeout(() => {
      const txId = "tx" + Math.random().toString(36).substring(2, 15)
      resolve(txId)
    }, 2000)
  })
}

// Simulate blockchain verification
export async function verifyOnBlockchain(hash: string): Promise<any | null> {
  return new Promise((resolve) => {
    // In a real app, this would query the ICP canister
    // This is just a simulation
    setTimeout(() => {
      // 80% chance of finding the hash
      if (Math.random() < 0.8) {
        resolve({
          owner: "2vxsx-fae",
          ownerName: "Demo User",
          timestamp: new Date().getTime() - Math.random() * 10000000000,
          txId: "tx" + Math.random().toString(36).substring(2, 15),
        })
      } else {
        resolve(null)
      }
    }, 1500)
  })
}

