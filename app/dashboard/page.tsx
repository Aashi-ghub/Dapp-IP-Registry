"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-provider"
import { ExternalLink, FileText, Clock, Search } from "lucide-react"
import Link from "next/link"

// Mock data for registered works
const mockWorks = [
  {
    id: "1",
    title: "Digital Artwork - Abstract Composition",
    hash: "8f7d56a1c59e8a76b012ef5d8b8f2b9e7c6f4d2a1b5c8d7e4f1a2b5c8d7e4f1a",
    category: "art",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    txId: "txabcdef123456",
  },
  {
    id: "2",
    title: "Electronic Music Track - Ambient Flow",
    hash: "2a1b5c8d7e4f1a2b5c8d7e4f1a2b5c8d7e4f1a2b5c8d7e4f1a2b5c8d7e4f1a",
    category: "music",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    txId: "tx123456abcdef",
  },
  {
    id: "3",
    title: "Research Paper - Blockchain Applications",
    hash: "5c8d7e4f1a2b5c8d7e4f1a2b5c8d7e4f1a2b5c8d7e4f1a2b5c8d7e4f1a2b5c",
    category: "literature",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    txId: "tx7890abcdef12",
  },
]

export default function DashboardPage() {
  const { isConnected } = useWallet()
  const router = useRouter()
  const [works, setWorks] = useState<typeof mockWorks>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect to auth if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/auth")
    } else {
      // Simulate loading data
      setTimeout(() => {
        setWorks(mockWorks)
        setIsLoading(false)
      }, 1000)
    }
  }, [isConnected, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const truncateHash = (hash: string) => {
    return hash.substring(0, 8) + "..." + hash.substring(hash.length - 8)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <h1 className="text-3xl font-bold">Your Registered Works</h1>
              <Button asChild className="mt-4 md:mt-0">
                <Link href="/register">Register New Work</Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="glass-card p-8 rounded-lg text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading your registered works...</p>
                </div>
              </div>
            ) : works.length > 0 ? (
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-4 text-left font-medium">Title</th>
                        <th className="px-6 py-4 text-left font-medium">Hash</th>
                        <th className="px-6 py-4 text-left font-medium">Date</th>
                        <th className="px-6 py-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {works.map((work) => (
                        <tr key={work.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{work.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">{work.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono">{truncateHash(work.hash)}</code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(work.date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/verify?hash=${work.hash}`}>
                                  <Search className="h-3 w-3 mr-1" />
                                  Verify
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View on IC
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 rounded-lg text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">No Works Registered Yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    You haven't registered any intellectual property yet. Start by registering your first work.
                  </p>
                  <Button asChild>
                    <Link href="/register">Register Your First Work</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

