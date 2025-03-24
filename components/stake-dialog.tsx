"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { icAgent } from "@/lib/ic-agent"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Coins, ShieldCheck, ChevronRight, CheckCircle2, ArrowLeft } from "lucide-react"

interface StakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ipId: bigint | null
  onSuccess?: () => void
}

export function StakeDialog({ open, onOpenChange, ipId, onSuccess }: StakeDialogProps) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState<string>("100")
  const [isStaking, setIsStaking] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  // Reset dialog state when opened
  useEffect(() => {
    if (open) {
      setStep(1)
      setAmount("100")
      setIsSuccess(false)
    }
  }, [open])

  const handleStake = async () => {
    if (!ipId) return

    try {
      setIsStaking(true)
      const stakeAmount = BigInt(parseFloat(amount) * 100)
      const success = await icAgent.stake(ipId, stakeAmount)
      
      if (success) {
        setIsSuccess(true)
        setStep(3)
        toast({
          title: "Staking successful",
          description: `Successfully staked ${amount} tokens on IP #${ipId.toString()}`,
        })
      } else {
        toast({
          title: "Staking failed",
          description: "There was a problem with your staking transaction.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Staking error:", error)
      toast({
        title: "Staking error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsStaking(false)
    }
  }

  const handleClose = () => {
    if (isSuccess && onSuccess) {
      onSuccess()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            {step === 1 && (
              <>
                <Coins className="mr-2 h-5 w-5 text-primary" />
                Stake Tokens
              </>
            )}
            {step === 2 && (
              <>
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
                Confirm Staking
              </>
            )}
            {step === 3 && (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                Staking Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Staking tokens increases the value and credibility of your intellectual property."}
            {step === 2 && "Please review your staking amount before proceeding."}
            {step === 3 && "Your tokens have been successfully staked on this intellectual property."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-300">Stake Amount</Label>
                  <div className="px-2 py-1 bg-primary/20 rounded-md text-primary font-medium">
                    {amount} tokens
                  </div>
                </div>
                
                <div className="py-4">
                  <Slider 
                    defaultValue={[100]} 
                    max={1000} 
                    min={10} 
                    step={10}
                    onValueChange={(values) => setAmount(values[0].toString())} 
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>10 tokens</span>
                    <span>1000 tokens</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="custom-amount" className="text-sm text-gray-400">Or enter custom amount:</Label>
                  <Input
                    id="custom-amount"
                    placeholder="Enter amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/30">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Benefits of Staking</h4>
                <ul className="text-xs text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <div className="h-4 w-4 text-blue-400 mr-2">•</div>
                    <span>Increases credibility of your intellectual property</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-4 w-4 text-blue-400 mr-2">•</div>
                    <span>Raises the cost threshold for disputes</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-4 w-4 text-blue-400 mr-2">•</div>
                    <span>Shows your commitment to the value of the work</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <DialogFooter className="flex sm:justify-between mt-6 pt-2 border-t border-gray-800">
              <Button variant="outline" onClick={handleClose} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
                Cancel
              </Button>
              <Button onClick={() => setStep(2)} className="bg-primary hover:bg-primary/90">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="bg-gray-800/60 p-5 rounded-lg border border-gray-700/50">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between border-b border-gray-700/50 pb-3">
                  <span className="text-gray-400">IP ID</span>
                  <span className="font-medium text-white">#{ipId?.toString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700/50 pb-3">
                  <span className="text-gray-400">Stake Amount</span>
                  <span className="font-medium text-primary">{amount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction Fee</span>
                  <span className="font-medium text-white">0.0001 tokens</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-900/30">
              <h4 className="text-sm font-medium text-yellow-500 mb-2">Please Note</h4>
              <p className="text-xs text-gray-300">
                Once staked, tokens can't be immediately withdrawn. They'll remain locked until certain conditions are met 
                or a pre-defined period has passed.
              </p>
            </div>
            
            <DialogFooter className="flex sm:justify-between mt-6 pt-2 border-t border-gray-800">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)} 
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleStake} 
                disabled={isStaking}
                className="bg-primary hover:bg-primary/90"
              >
                {isStaking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Stake Tokens
                    <Coins className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Staking Successful!</h3>
              <p className="text-gray-400 text-center max-w-xs">
                You have successfully staked {amount} tokens on your intellectual property #{ipId?.toString()}.
              </p>
            </div>
            
            <div className="bg-gray-800/60 p-5 rounded-lg border border-gray-700/50">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between border-b border-gray-700/50 pb-3">
                  <span className="text-gray-400">IP ID</span>
                  <span className="font-medium text-white">#{ipId?.toString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700/50 pb-3">
                  <span className="text-gray-400">Staked Amount</span>
                  <span className="font-medium text-primary">{amount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="font-medium text-green-500">Confirmed</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6 pt-2 border-t border-gray-800">
              <Button 
                onClick={handleClose} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 