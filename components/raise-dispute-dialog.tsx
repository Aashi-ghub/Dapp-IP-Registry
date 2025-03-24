"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { icAgent } from "@/lib/ic-agent"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle } from "lucide-react"

interface RaiseDisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ipId: bigint | null
  onSuccess?: () => void
}

export function RaiseDisputeDialog({ open, onOpenChange, ipId, onSuccess }: RaiseDisputeDialogProps) {
  const [reason, setReason] = useState<string>("")
  const [stake, setStake] = useState<string>("100")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleRaiseDispute = async () => {
    if (!ipId || !reason.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide a reason for the dispute",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const stakeAmount = BigInt(parseInt(stake, 10))
      const result = await icAgent.raiseDispute(ipId, reason, stakeAmount)
      
      if ('ok' in result) {
        const disputeId = result.ok
        toast({
          title: "Dispute raised",
          description: `Dispute #${disputeId.toString()} has been raised against IP #${ipId.toString()}`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Failed to raise dispute",
          description: result.err || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Dispute submission error:", error)
      toast({
        title: "Dispute submission error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setReason("")
      setStake("100")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise a Dispute</DialogTitle>
          <DialogDescription>
            Challenge the validity of this intellectual property claim.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Important</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Raising a dispute requires staking tokens. If your dispute is rejected, you will lose your stake.
                  Malicious disputes may result in penalties.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Dispute Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you are disputing this IP claim (e.g., prior art, copyright violation)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stake">Stake Amount</Label>
            <Input
              id="stake"
              type="number"
              min="100"
              placeholder="100"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Minimum stake is 100 tokens. Higher stakes signal stronger conviction in your dispute.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={handleRaiseDispute} variant="destructive">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Processing..." : "Raise Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 