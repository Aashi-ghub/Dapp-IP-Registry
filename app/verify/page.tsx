"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyOnBlockchain } from "@/lib/utils"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function VerifyPage() {
  const { toast } = useToast()
  const [hash, setHash] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<"success" | "failure" | null>(null)

  const handleVerify = async () => {
    if (!hash) {
      toast({
        title: "No hash provided",
        description: "Please enter a hash to verify",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)
    setVerificationStatus(null)

    try {
      const result = await verifyOnBlockchain(hash)
      setVerificationResult(result)
      setVerificationStatus(result ? "success" : "failure")

      if (result) {
        toast({
          title: "Verification successful",
          description: "The hash was found on the blockchain",
        })
      } else {
        toast({
          title: "Verification failed",
          description: "No record found for this hash",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Verification error",
        description: "There was a problem verifying the hash",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Verify Ownership</h1>

            <div className="glass-card p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-4">Enter Hash to Verify</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hash">Hash</Label>
                  <Input
                    id="hash"
                    placeholder="Enter the hash of the work to verify"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                  />
                </div>

                <Button onClick={handleVerify} disabled={!hash || isVerifying} className="w-full">
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Check Ownership"
                  )}
                </Button>
              </div>
            </div>

            {verificationStatus && (
              <div
                className={`glass-card p-6 rounded-lg ${
                  verificationStatus === "success" ? "bg-primary/10" : "bg-destructive/10"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {verificationStatus === "success" ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold">Verification Successful</h2>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <h2 className="text-xl font-semibold">Verification Failed</h2>
                    </>
                  )}
                </div>

                {verificationStatus === "success" && verificationResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Owner</p>
                        <p>{verificationResult.ownerName}</p>
                        <p className="text-xs font-mono mt-1">{verificationResult.owner}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                        <p>{formatDate(verificationResult.timestamp)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded mt-1">{verificationResult.txId}</p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        This record is permanently stored on the Internet Computer blockchain and cannot be altered.
                      </p>
                    </div>
                  </div>
                )}

                {verificationStatus === "failure" && (
                  <div>
                    <p className="text-muted-foreground">No record was found for the provided hash. This could mean:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>The work has not been registered on our platform</li>
                      <li>The hash was entered incorrectly</li>
                      <li>The work may have been registered on a different platform</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

