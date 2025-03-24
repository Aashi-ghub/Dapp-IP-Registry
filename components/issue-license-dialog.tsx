"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { icAgent } from "@/lib/ic-agent"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface IssueLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ipId: bigint | null
  onSuccess?: () => void
}

export function IssueLicenseDialog({ open, onOpenChange, ipId, onSuccess }: IssueLicenseDialogProps) {
  const [licensee, setLicensee] = useState<string>("")
  const [terms, setTerms] = useState<string>("")
  const [royalty, setRoyalty] = useState<string>("5")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleIssueLicense = async () => {
    if (!ipId || !licensee.trim() || !terms.trim()) {
      toast({
        title: "Invalid input",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const royaltyValue = parseInt(royalty, 10)
      const result = await icAgent.issueLicense(ipId, licensee, terms, royaltyValue)
      
      if ('ok' in result) {
        const licenseId = result.ok
        toast({
          title: "License issued successfully",
          description: `License #${licenseId.toString()} has been issued to ${licensee}`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Failed to issue license",
          description: result.err || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("License issuance error:", error)
      toast({
        title: "License issuance error",
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
          <DialogTitle>Issue License</DialogTitle>
          <DialogDescription>
            Issue a license to allow others to use your intellectual property.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="licensee">Licensee Principal ID</Label>
            <Input
              id="licensee"
              placeholder="Enter principal ID of the licensee"
              value={licensee}
              onChange={(e) => setLicensee(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">License Terms</Label>
            <Textarea
              id="terms"
              placeholder="Specify the terms and conditions of this license"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="royalty">Royalty Percentage (%)</Label>
            <Input
              id="royalty"
              type="number"
              min="0"
              max="100"
              placeholder="5"
              value={royalty}
              onChange={(e) => setRoyalty(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={handleIssueLicense}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Processing..." : "Issue License"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 