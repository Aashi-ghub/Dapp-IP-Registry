"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-provider"
import { FileText, Clock, ThumbsUp, ThumbsDown, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { icAgent } from "@/lib/ic-agent"
import { Principal } from "@dfinity/principal"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ResolveDisputeDialog } from "@/components/resolve-dispute-dialog"
import { formatDuration } from "@/lib/utils"
import { CopyToClipboard } from "@/components/copy-to-clipboard"

// Define dispute object structure for frontend display
interface DisputeItem {
  id: string;
  ipId: string;
  title: string;
  reason: string;
  challenger: string;
  votesFor: number;
  votesAgainst: number;
  status: 'Open' | 'Resolved';
  resolvedInFavorOfOriginal?: boolean;
  date: string;
}

export default function DisputesPage() {
  const { isConnected, principalId } = useWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [disputes, setDisputes] = useState<DisputeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [selectedIpId, setSelectedIpId] = useState<string | null>(null)
  const [isRaisingDispute, setIsRaisingDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeStake, setDisputeStake] = useState("100")
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [selectedDisputeId, setSelectedDisputeId] = useState<bigint | null>(null)

  // Redirect to auth if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/auth")
      return
    }

    // Fetch disputes data
    fetchDisputes()
  }, [isConnected, router])

  const fetchDisputes = async () => {
    setIsLoading(true)
    try {
      // Fetch all IPs to associate them with disputes
      const ips = await icAgent.listAllIPs()
      
      // Collect disputes from all IPs
      const allDisputes: DisputeItem[] = []
      
      for (const ip of ips) {
        // For each IP that has disputes
        if (ip.disputes && ip.disputes.length > 0) {
          // This is a simplified implementation - in a real app, you would have
          // a canister method to fetch dispute details directly
          // For now we'll simulate with mock data based on the IP
          for (const disputeId of ip.disputes) {
            // In a real implementation, you would fetch each dispute
            // For now, create some mock data based on the IP
            allDisputes.push({
              id: disputeId.toString(),
              ipId: ip.id.toString(),
              title: ip.title,
              reason: "Claimed copyright infringement",
              challenger: Principal.fromText("2vxsx-fae").toString(),
              votesFor: Math.floor(Math.random() * 10),
              votesAgainst: Math.floor(Math.random() * 10),
              status: Math.random() > 0.5 ? 'Open' : 'Resolved',
              resolvedInFavorOfOriginal: Math.random() > 0.5,
              date: formatDuration(Number(ip.created)),
            })
          }
        }
      }
      
      setDisputes(allDisputes)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (disputeId: string, supportOriginal: boolean) => {
    setIsVoting(true)
    try {
      const result = await icAgent.voteOnDispute(BigInt(disputeId), supportOriginal)
      
      if ('ok' in result) {
        toast({
          title: "Vote submitted",
          description: `You voted ${supportOriginal ? 'for' : 'against'} the original IP`,
        })
        
        // Refresh disputes
        await fetchDisputes()
      } else {
        toast({
          title: "Vote failed",
          description: result.err,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleResolveInit = (disputeId: string) => {
    setSelectedDisputeId(BigInt(disputeId))
    setIsResolveDialogOpen(true)
  }

  const handleRaiseDispute = async () => {
    if (!selectedIpId) return
    
    setIsRaisingDispute(true)
    try {
      const result = await icAgent.raiseDispute(
        BigInt(selectedIpId), 
        disputeReason, 
        BigInt(disputeStake)
      )
      
      if ('ok' in result) {
        toast({
          title: "Dispute raised",
          description: "Your dispute has been successfully submitted",
        })
        
        // Reset form and close dialog
        setSelectedIpId(null)
        setDisputeReason("")
        setDisputeStake("100")
        
        // Refresh disputes
        await fetchDisputes()
      } else {
        toast({
          title: "Failed to raise dispute",
          description: result.err,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error raising dispute:", error)
      toast({
        title: "Error",
        description: "Failed to raise dispute",
        variant: "destructive",
      })
    } finally {
      setIsRaisingDispute(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const timestamp = Number(dateString);
      
      // Convert nanoseconds to milliseconds if needed
      const timestampInMs = timestamp > 1_000_000_000_000_000 
        ? Math.floor(timestamp / 1_000_000) 
        : timestamp;
      
      return new Date(timestampInMs).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }

  const truncatePrincipal = (principal: string) => {
    return principal.substring(0, 5) + "..." + principal.substring(principal.length - 3)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navbar />
      <AnimatedBackground className="fixed inset-0 -z-10" density="low" />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Dispute Center</h1>
        
        <div className="flex gap-2 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/explorer")}
            className="border-gray-700 hover:border-primary hover:bg-primary/10"
          >
            <ExternalLink className="h-4 w-4 mr-2 text-primary" />
            <span className="text-primary">Browse IP Registry</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="mt-4 text-lg text-gray-300">Loading disputes...</span>
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-gray-700/50 bg-gray-800/30 backdrop-blur-sm p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400" />
            <h3 className="text-xl font-medium text-white">No disputes found</h3>
            <p className="text-sm text-gray-400">
              There are no active disputes in the system yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {disputes.map((dispute) => (
              <div 
                key={dispute.id} 
                className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-md overflow-hidden hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle 
                      className={`h-5 w-5 ${dispute.status === 'Resolved' ? 'text-gray-500' : 'text-red-500'}`} 
                    />
                    <span className="ml-2 font-semibold text-white">
                      Dispute #{dispute.id}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      dispute.status === 'Resolved' 
                        ? 'bg-gray-900/70 text-gray-300' 
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2 text-white">
                  <Link href={`/dashboard?ipId=${dispute.ipId}`} className="hover:text-primary transition-colors">
                    {dispute.title}
                  </Link>
                </h3>
                
                <div className="space-y-2 text-sm mb-4 bg-gray-900/40 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">IP ID:</span>
                    <CopyToClipboard
                      text={dispute.ipId}
                      className="font-mono text-gray-300"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Challenger:</span>
                    <CopyToClipboard
                      text={dispute.challenger}
                      displayText={truncatePrincipal(dispute.challenger)}
                      className="font-mono text-gray-300"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-gray-300">{dispute.date}</span>
                  </div>
                </div>
                
                <div className="bg-gray-900/60 p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-1 text-primary">Reason for dispute:</p>
                  <p className="text-sm text-gray-300">{dispute.reason}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-900/20 p-3 rounded-lg text-center border border-green-800/30">
                    <p className="text-sm font-medium text-green-400">For Original</p>
                    <p className="text-2xl font-bold text-green-400">{dispute.votesFor}</p>
                  </div>
                  <div className="bg-red-900/20 p-3 rounded-lg text-center border border-red-800/30">
                    <p className="text-sm font-medium text-red-400">Against Original</p>
                    <p className="text-2xl font-bold text-red-400">{dispute.votesAgainst}</p>
                  </div>
                </div>
                
                {dispute.status === 'Open' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleVote(dispute.id, true)}
                        disabled={isVoting}
                        className="border-green-800 text-green-400 hover:bg-green-900/30 hover:border-green-700"
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Support Original
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVote(dispute.id, false)}
                        disabled={isVoting}
                        className="border-red-800 text-red-400 hover:bg-red-900/30 hover:border-red-700"
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Against Original
                      </Button>
                    </div>
                    
                    {principalId === dispute.challenger && (
                      <Button 
                        variant="default" 
                        className="w-full mt-2 bg-primary hover:bg-primary/90"
                        onClick={() => handleResolveInit(dispute.id)}
                      >
                        Resolve Dispute
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-900/60 p-3 rounded-lg text-center border border-gray-700/50">
                    <p className="text-sm text-gray-300">
                      This dispute has been resolved 
                      {dispute.resolvedInFavorOfOriginal ? " in favor of " : " against "} 
                      the original owner.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isRaisingDispute} onOpenChange={setIsRaisingDispute}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Raise a Dispute</DialogTitle>
            <DialogDescription className="text-gray-300">
              Explain why you believe this IP registration should be challenged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-200">Reason for dispute</Label>
              <Textarea
                id="reason"
                placeholder="Explain the reason for this dispute"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
                className="bg-gray-700 border-gray-600 focus:border-primary text-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stake" className="text-gray-200">Stake amount (tokens)</Label>
              <Input
                id="stake"
                type="number"
                min="1"
                placeholder="100"
                value={disputeStake}
                onChange={(e) => setDisputeStake(e.target.value)}
                className="bg-gray-700 border-gray-600 focus:border-primary text-gray-200"
              />
              <p className="text-xs text-gray-400">
                You must stake tokens to raise a dispute. This stake will be returned if your dispute is successful.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRaisingDispute(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button 
              onClick={handleRaiseDispute} 
              disabled={!disputeReason || !disputeStake || isRaisingDispute}
              className="bg-primary hover:bg-primary/90"
            >
              {isRaisingDispute ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResolveDisputeDialog 
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        disputeId={selectedDisputeId}
        ipId={selectedIpId ? BigInt(selectedIpId) : null}
        onSuccess={fetchDisputes}
      />

      <Footer />
    </div>
  )
} 