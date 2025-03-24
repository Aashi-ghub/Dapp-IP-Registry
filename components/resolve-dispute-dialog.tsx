"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { icAgent } from "@/lib/ic-agent"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"

interface ResolveDisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disputeId: bigint | null
  ipId: bigint | null
  onSuccess?: () => void
}

export function ResolveDisputeDialog({ open, onOpenChange, disputeId, ipId, onSuccess }: ResolveDisputeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleResolveDispute = async () => {
    if (!disputeId) {
      toast({
        title: "Invalid dispute",
        description: "No dispute selected to resolve",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const result = await icAgent.resolveDispute(disputeId)
      
      if ('ok' in result) {
        const originalOwnerWins = result.ok
        toast({
          title: "Dispute resolved",
          description: originalOwnerWins 
            ? "Dispute resolved in favor of the original owner." 
            : "Dispute resolved against the original owner. IP has been revoked.",
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Failed to resolve dispute",
          description: result.err || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Dispute resolution error:", error)
      toast({
        title: "Dispute resolution error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Dispute</DialogTitle>
          <DialogDescription>
            {ipId 
              ? `Resolve the dispute for IP #${ipId.toString()}`
              : "Resolve this intellectual property dispute"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warning</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Resolving this dispute will distribute stakes based on the vote outcome.
                  If the dispute is resolved against the original owner, the IP will be revoked.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={handleResolveDispute} variant="destructive">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Processing..." : "Resolve Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 