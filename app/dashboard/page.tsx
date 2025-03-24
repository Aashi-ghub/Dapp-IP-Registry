"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-provider"
import { 
  ExternalLink, 
  FileText, 
  Clock, 
  Search, 
  Download, 
  Shield, 
  PlusCircle, 
  AlertTriangle,
  UserPlus,
  Coins,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"
import { icAgent } from "@/lib/ic-agent"
import { IpRecordPublic } from "@/lib/ic-agent"
import { getFileFromBlockchain, formatDuration, formatPrincipal } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { StakeDialog } from "@/components/stake-dialog"
import { IssueLicenseDialog } from "@/components/issue-license-dialog"
import { TransferOwnershipDialog } from "@/components/transfer-ownership-dialog"
import { RaiseDisputeDialog } from "@/components/raise-dispute-dialog"
import { CopyToClipboard } from "@/components/copy-to-clipboard"

// Define work object structure for frontend display
interface WorkItem {
  id: string;
  title: string;
  hash: string;
  category: string;
  date: string;
  txId: string;
  status: string;
  licenses: number;
  disputes: number;
}

export default function DashboardPage() {
  const { isConnected, principalId } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [works, setWorks] = useState<WorkItem[]>([])
  const [selectedIpId, setSelectedIpId] = useState<bigint | null>(null)
  const [selectedIp, setSelectedIp] = useState<IpRecordPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isStakingOpen, setIsStakingOpen] = useState(false)
  const [isLicenseOpen, setIsLicenseOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isDisputeOpen, setIsDisputeOpen] = useState(false)
  const { toast } = useToast()

  // Get IP ID from URL if provided
  useEffect(() => {
    const ipId = searchParams.get('ipId')
    if (ipId) {
      setSelectedIpId(BigInt(ipId))
    }
  }, [searchParams])

  // Fetch selected IP details
  useEffect(() => {
    if (selectedIpId) {
      const fetchIpDetails = async () => {
        try {
          const ipDetails = await icAgent.getIp(selectedIpId)
          if (ipDetails) {
            setSelectedIp(ipDetails)
          }
        } catch (error) {
          console.error("Error fetching IP details:", error)
        }
      }
      fetchIpDetails()
    }
  }, [selectedIpId])

  // Redirect to auth if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/auth")
      return
    }

    // Fetch data from the blockchain
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const ips = await icAgent.listAllIPs()
        if (ips.length > 0) {
          // Filter IPs to only show the current user's works
          const userIps = ips.filter(ip => {
            return ip.owner.toString() === principalId
          })

          const formattedWorks = userIps.map(ip => ({
            id: ip.id.toString(),
            title: ip.title,
            hash: ip.file_hash,
            category: getCategoryFromTitle(ip.title),
            date: formatDuration(Number(ip.created)),
            txId: ip.id.toString(),
            status: getStatusText(ip.status),
            licenses: ip.licenses.length,
            disputes: ip.disputes.length
          }))
          setWorks(formattedWorks)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load your intellectual properties",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isConnected, principalId, router, toast, isStakingOpen, isLicenseOpen, isTransferOpen, isDisputeOpen])

  const getStatusText = (status: any): string => {
    if ('Verified' in status) return "Verified"
    if ('Unverified' in status) return "Unverified"
    if ('UnderDispute' in status) return "Under Dispute"
    if ('Revoked' in status) return "Revoked"
    return "Unknown"
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Verified": return "text-green-500"
      case "Unverified": return "text-yellow-500"
      case "Under Dispute": return "text-red-500"
      case "Revoked": return "text-gray-500"
      default: return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Verified": return <Shield className="h-5 w-5 text-green-500" />
      case "Unverified": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "Under Dispute": return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "Revoked": return <Shield className="h-5 w-5 text-gray-500" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getCategoryFromTitle = (title: string): string => {
    if (!title) return "Other"
    
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes("image") || lowerTitle.includes("photo") || lowerTitle.includes("picture")) {
      return "Image"
    } else if (lowerTitle.includes("document") || lowerTitle.includes("paper") || lowerTitle.includes("text")) {
      return "Document"
    } else if (lowerTitle.includes("code") || lowerTitle.includes("software") || lowerTitle.includes("program")) {
      return "Software"
    } else if (lowerTitle.includes("music") || lowerTitle.includes("audio") || lowerTitle.includes("sound")) {
      return "Music"
    }
    
    return "Other"
  }

  const formatDate = (dateString: string) => {
    try {
      const timestamp = Number(dateString);
      
      // Convert nanoseconds to milliseconds if needed
      // IC timestamps can be in nanoseconds (10^9 times larger than JS milliseconds)
      const timestampInMs = timestamp > 1_000_000_000_000_000 
        ? Math.floor(timestamp / 1_000_000) 
        : timestamp;
      
      return new Date(timestampInMs).toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }

  const truncateHash = (hash: string) => {
    return hash.length > 15 ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}` : hash
  }

  const handleDownload = async (id: string) => {
    setIsDownloading(id)
    try {
      const ipId = BigInt(id)
      const fileData = await getFileFromBlockchain(ipId)
      
      if (!fileData) {
        // This is not an error but a normal state - the file might not be uploaded yet
        toast({
          title: "File not available",
          description: "The file hasn't been uploaded yet or is still being processed.",
          variant: "default"
        })
        return
      }
      
      // Create a download link and trigger the download
      const downloadLink = document.createElement('a')
      downloadLink.href = fileData.url
      downloadLink.download = fileData.filename
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      
      // Clean up the URL object to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(fileData.url), 100)
      
      toast({
        title: "Download started",
        description: `Downloading ${fileData.filename}`,
      })
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "Download error",
        description: "There was a problem processing the download request.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(null)
    }
  }

  const refreshData = () => {
    setSelectedIp(null)
    if (selectedIpId) {
      const fetchIpDetails = async () => {
        try {
          const ipDetails = await icAgent.getIp(selectedIpId)
          if (ipDetails) {
            setSelectedIp(ipDetails)
          }
        } catch (error) {
          console.error("Error refreshing IP details:", error)
        }
      }
      fetchIpDetails()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navbar />
      <AnimatedBackground className="fixed inset-0 -z-10" density="low" />
      
      <div className="container mx-auto flex-1 px-4 py-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">IP Dashboard</h1>
        
        {isLoading ? (
          <div className="mt-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="mt-4 text-xl text-gray-300">Loading your intellectual properties...</span>
          </div>
        ) : (
          <div className="mt-8">
            {/* No selected IP, show list view */}
            {!selectedIp ? (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Your Intellectual Properties</h2>
                  <Button onClick={() => router.push("/register")} className="hover-lift">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Register New IP
                  </Button>
                </div>
                
                {works.length === 0 ? (
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/50">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-xl font-medium text-white">No intellectual properties found</h3>
                    <p className="mt-2 text-gray-400">
                      You haven't registered any intellectual properties yet.
                    </p>
                    <Button className="mt-6 hover-lift" onClick={() => router.push("/register")}>
                      Register Your First IP
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {works.map(work => (
                      <div 
                        key={work.id} 
                        className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer hover:-translate-y-1"
                        onClick={() => setSelectedIpId(BigInt(work.id))}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`flex items-center ${getStatusColor(work.status)}`}>
                            {getStatusIcon(work.status)}
                            <span className="ml-2 font-medium">{work.status}</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-700/70 rounded-full">{work.category}</span>
                        </div>
                        <h3 className="text-lg font-medium mb-3 line-clamp-1">{work.title}</h3>
                        <div className="flex items-center text-xs text-gray-400 mb-4">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>{work.date}</span>
                        </div>
                        <div className="text-xs bg-gray-900/60 rounded-md p-2 mb-4 font-mono truncate">
                          Hash: {truncateHash(work.hash)}
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-700/50">
                          <div className="flex items-center">
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Licenses: {work.licenses}
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Disputes: {work.disputes}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* IP Detail View */
              <div>
                <div className="mb-6 flex items-center">
                  <Button 
                    variant="outline" 
                    className="mr-3 group"
                    onClick={() => setSelectedIp(null)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back 
                  </Button>
                  <h2 className="text-2xl font-semibold">{selectedIp.title}</h2>
                </div>
                
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                      {/* IP Info Section */}
                      <div className="bg-gray-900/40 rounded-lg p-5">
                        <h3 className="text-lg font-medium mb-4 text-primary">IP Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-gray-700/50 pb-2">
                            <span className="text-gray-400">ID</span>
                            <span className="font-medium text-white">{selectedIp.id.toString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-700/50 pb-2">
                            <span className="text-gray-400">Status</span>
                            <span className={`font-medium ${getStatusColor(getStatusText(selectedIp.status))}`}>
                              {getStatusText(selectedIp.status)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-gray-700/50 pb-2">
                            <span className="text-gray-400">Created</span>
                            <span className="font-medium text-white">{formatDuration(Number(selectedIp.created))}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-700/50 pb-2">
                            <span className="text-gray-400">Owner</span>
                            <CopyToClipboard 
                              text={selectedIp.owner.toString()}
                              displayText={formatPrincipal(selectedIp.owner.toString())}
                              className="font-mono text-sm text-white"
                            />
                          </div>
                          <div className="flex justify-between border-b border-gray-700/50 pb-2">
                            <span className="text-gray-400">File Hash</span>
                            <CopyToClipboard
                              text={selectedIp.file_hash}
                              displayText={truncateHash(selectedIp.file_hash)}
                              className="font-mono text-sm text-white"
                            />
                          </div>
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Stakes</span>
                            <span className="font-medium text-white">{selectedIp.stakes.toString()} tokens</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Description Section */}
                      {selectedIp.description && (
                        <div className="bg-gray-900/40 rounded-lg p-5">
                          <h3 className="text-lg font-medium mb-3 text-primary">Description</h3>
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {selectedIp.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Licenses Section */}
                      <div className="bg-gray-900/40 rounded-lg p-5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-primary">Licenses ({selectedIp.licenses.length})</h3>
                          {selectedIp.owner.toString() === principalId && (
                            <Button 
                              size="sm"
                              onClick={() => setIsLicenseOpen(true)}
                              className="hover-lift"
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Issue License
                            </Button>
                          )}
                        </div>
                        
                        {selectedIp.licenses.length === 0 ? (
                          <p className="text-gray-400 text-sm">No licenses have been issued for this IP.</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedIp.licenses.map((license) => (
                              <div key={license.id.toString()} className="border border-gray-700/50 rounded-lg p-4 bg-gray-800/40">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Licensee:</span>
                                  <span className="font-mono text-white">{formatPrincipal(license.licensee.toString())}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                  <span className="text-gray-400">Royalty:</span>
                                  <span className="text-white">{license.royalty.toString()}%</span>
                                </div>
                                <div className="mt-3 text-sm">
                                  <span className="text-gray-400">Terms:</span>
                                  <p className="mt-1 text-gray-300">{license.terms}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Disputes Section */}
                      <div className="bg-gray-900/40 rounded-lg p-5">
                        <h3 className="text-lg font-medium mb-3 text-primary">Disputes ({selectedIp.disputes.length})</h3>
                        {selectedIp.disputes.length === 0 ? (
                          <p className="text-gray-400 text-sm">No disputes have been raised against this IP.</p>
                        ) : (
                          <div className="text-gray-300">
                            <p>This IP has {selectedIp.disputes.length} active dispute(s).</p>
                            <Link 
                              href={`/disputes?ipId=${selectedIp.id.toString()}`}
                              className="text-primary hover:underline flex items-center mt-3 hover-lift"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Disputes
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions Section */}
                    <div className="bg-gray-900/40 rounded-lg p-5 h-fit">
                      <h3 className="text-lg font-medium mb-4 text-primary">Actions</h3>
                      <div className="space-y-4">
                        <Button 
                          className="w-full hover-lift"
                          onClick={() => handleDownload(selectedIp.id.toString())}
                          disabled={isDownloading === selectedIp.id.toString()}
                        >
                          {isDownloading === selectedIp.id.toString() ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Download File
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full hover-lift"
                          onClick={() => setIsStakingOpen(true)}
                        >
                          <Coins className="mr-2 h-4 w-4" />
                          Stake Tokens
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full hover-lift"
                          onClick={() => setIsTransferOpen(true)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Transfer Ownership
                        </Button>
                      </div>
                      
                      {selectedIp.owner.toString() !== principalId && (
                        <div className="pt-6 mt-6 border-t border-gray-700/50">
                          <h4 className="text-sm font-medium mb-3 text-gray-300">For Other Users</h4>
                          <Button 
                            variant="destructive" 
                            className="w-full hover-lift"
                            onClick={() => setIsDisputeOpen(true)}
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Raise Dispute
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Dialogs */}
      <StakeDialog 
        open={isStakingOpen} 
        onOpenChange={setIsStakingOpen} 
        ipId={selectedIpId}
        onSuccess={refreshData}
      />
      
      <IssueLicenseDialog 
        open={isLicenseOpen} 
        onOpenChange={setIsLicenseOpen} 
        ipId={selectedIpId}
        onSuccess={refreshData}
      />
      
      <TransferOwnershipDialog 
        open={isTransferOpen} 
        onOpenChange={setIsTransferOpen} 
        ipId={selectedIpId}
        onSuccess={() => {
          refreshData()
          setSelectedIp(null)
        }}
      />
      
      <RaiseDisputeDialog 
        open={isDisputeOpen} 
        onOpenChange={setIsDisputeOpen} 
        ipId={selectedIpId}
        onSuccess={refreshData}
      />
      
      <Footer />
    </div>
  )
}

// Constants
const DFX_NETWORK = process.env.NEXT_PUBLIC_DFX_NETWORK || "local";
const IP_REGISTRY_CANISTER_ID = process.env.NEXT_PUBLIC_IP_REGISTRY_CANISTER_ID || "rrkah-fqaaa-aaaaa-aaaaq-cai";

