"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { icAgent } from "@/lib/ic-agent"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Loader2 } from "lucide-react"

interface TransferOwnershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ipId: bigint | null
  onSuccess?: () => void
}

export function TransferOwnershipDialog({ open, onOpenChange, ipId, onSuccess }: TransferOwnershipDialogProps) {
  const [newOwner, setNewOwner] = useState<string>("")
  const [confirmTransfer, setConfirmTransfer] = useState<boolean>(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const { toast } = useToast()

  const handleTransferOwnership = async () => {
    if (!ipId || !newOwner.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter the new owner's principal ID",
        variant: "destructive",
      })
      return
    }

    if (!confirmTransfer) {
      setConfirmTransfer(true)
      return
    }

    try {
      setIsTransferring(true)
      const success = await icAgent.transferOwnership(ipId, newOwner)
      
      if (success) {
        toast({
          title: "Ownership transferred",
          description: `IP #${ipId.toString()} has been transferred to ${newOwner}`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Transfer failed",
          description: "There was a problem transferring ownership.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Transfer error:", error)
      toast({
        title: "Transfer error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
      setConfirmTransfer(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setNewOwner("")
      setConfirmTransfer(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer IP Ownership</DialogTitle>
          <DialogDescription>
            Transfer ownership of this intellectual property to another principal.
          </DialogDescription>
        </DialogHeader>
        {confirmTransfer && (
          <div className="my-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warning</h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    You are about to permanently transfer ownership of this IP. This action cannot be undone.
                    Click "Transfer" again to confirm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newOwner">New Owner Principal ID</Label>
            <Input
              id="newOwner"
              placeholder="Enter principal ID of the new owner"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Cancel
          </Button>
          <Button 
            disabled={isTransferring} 
            onClick={handleTransferOwnership}
            variant={confirmTransfer ? "destructive" : "default"}
          >
            {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isTransferring ? "Processing..." : confirmTransfer ? "Confirm Transfer" : "Transfer Ownership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 