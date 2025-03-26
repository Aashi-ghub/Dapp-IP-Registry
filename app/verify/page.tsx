"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyOnBlockchain, getFileFromBlockchain, generateFileHash } from "@/lib/utils"
import { Loader2, CheckCircle2, XCircle, ShieldAlert, Download, Eye, FileIcon, UploadCloud, AlertTriangle, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/components/wallet-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { icAgent } from "@/lib/ic-agent"
import { CopyToClipboard } from "@/components/copy-to-clipboard"

export default function VerifyPage() {
  const { toast } = useToast()
  const { isConnected, connect, isConnecting } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hash, setHash] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<"success" | "failure" | null>(null)
  const [fileData, setFileData] = useState<{url: string, mimeType: string, filename: string} | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isHashing, setIsHashing] = useState(false)
  const [allRegistrations, setAllRegistrations] = useState<Array<{
    id: bigint;
    owner: string;
    ownerName: string;
    timestamp: number;
    status: "Verified" | "Unverified" | "UnderDispute" | "Revoked";
  }>>([])

  // Redirect to auth if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/auth")
    }
  }, [isConnected, router])

  // Read hash from URL query parameter
  useEffect(() => {
    const hashParam = searchParams.get("hash")
    if (hashParam) {
      setHash(hashParam)
      // Auto-verify if hash is present in URL
      handleVerify(hashParam)
    }
  }, [searchParams, isConnected])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (fileData?.url) {
        URL.revokeObjectURL(fileData.url)
      }
    }
  }, [fileData])

  const handleVerify = async (providedHash?: string) => {
    const hashToVerify = providedHash || hash
    
    if (!hashToVerify) {
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
    setFileData(null)
    setAllRegistrations([])

    try {
      // Get all registrations for this hash
      await getAllRegistrationsForHash(hashToVerify)
      
      const result = await verifyOnBlockchain(hashToVerify)
      setVerificationResult(result)
      setVerificationStatus(result ? "success" : "failure")

      if (result) {
        toast({
          title: "Verification successful",
          description: "The hash was found on the blockchain",
        })
        
        // Get the file data
        await loadFile(result.id)
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

  // Get all registrations for a specific hash
  const getAllRegistrationsForHash = async (hashToVerify: string) => {
    try {
      // Use the new contract function instead of client-side filtering
      const matchingIps = await icAgent.getIpsByHash(hashToVerify)
      
      if (matchingIps && matchingIps.length > 0) {
        // Map to UI format
        const registrations = matchingIps.map(ip => {
          let status: "Verified" | "Unverified" | "UnderDispute" | "Revoked" = "Unverified"
          
          if ('Verified' in ip.status) {
            status = "Verified"
          } else if ('UnderDispute' in ip.status) {
            status = "UnderDispute"
          } else if ('Revoked' in ip.status) {
            status = "Revoked"
          }
          
          const owner = ip.owner.toString()
          return {
            id: ip.id,
            owner: owner,
            ownerName: owner.substring(0, 5) + "..." + owner.substring(owner.length - 5),
            timestamp: Number(ip.created),
            status: status
          }
        })
        
        setAllRegistrations(registrations)
      }
    } catch (error) {
      console.error("Error fetching all registrations:", error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
      setHash("")
    }
  }

  const handleVerifyFile = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to verify",
        variant: "destructive",
      })
      return
    }

    setIsHashing(true)
    setIsVerifying(true)
    setVerificationResult(null)
    setVerificationStatus(null)
    setFileData(null)
    setAllRegistrations([])

    try {
      // Step 1: Generate hash from file
      const fileHash = await generateFileHash(uploadedFile)
      setHash(fileHash)
      
      // Step 2: Verify the hash on blockchain
      const result = await verifyOnBlockchain(fileHash)
      setVerificationResult(result)
      
      // Step 3: Get all registrations with this hash
      await getAllRegistrationsForHash(fileHash)
      
      if (result) {
        setVerificationStatus("success")
        toast({
          title: "Verification successful",
          description: "The file was found on the blockchain",
        })
        
        // Step 4: Get the file data
        await loadFile(result.id)
      } else {
        setVerificationStatus("failure")
        toast({
          title: "Verification failed",
          description: "No record found for this file",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during verification:", error)
      toast({
        title: "Verification error",
        description: "There was a problem verifying the file",
        variant: "destructive",
      })
    } finally {
      setIsHashing(false)
      setIsVerifying(false)
    }
  }

  const loadFile = async (ipId: bigint) => {
    setIsLoadingFile(true)
    try {
      const data = await getFileFromBlockchain(ipId)
      setFileData(data)
    } catch (error) {
      console.error("Error loading file:", error)
      toast({
        title: "File loading error",
        description: "Failed to load the associated file",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFile(false)
    }
  }

  const formatDate = (timestamp: number) => {
    // Check if timestamp is a valid number
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return 'Unknown date';
    }
    
    // Convert nanoseconds to milliseconds if needed
    // IC timestamps can be in nanoseconds (10^9 times larger than JS milliseconds)
    if (timestamp > 1_000_000_000_000_000) {  // If timestamp is very large (in nanoseconds)
      timestamp = Math.floor(timestamp / 1_000_000);  // Convert to milliseconds
    }
    
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date format';
    }
  }

  const renderFilePreview = () => {
    if (!fileData) return null
    
    const isImage = fileData.mimeType.startsWith('image/')
    const isPdf = fileData.mimeType === 'application/pdf'
    const isText = fileData.mimeType.startsWith('text/')
    const isHTML = fileData.mimeType === 'text/html'
    const isJSON = fileData.mimeType === 'application/json'
    const isAudio = fileData.mimeType.startsWith('audio/')
    const isVideo = fileData.mimeType.startsWith('video/')
    
    return (
      <div className="mt-6 p-4 border rounded-md bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">File Preview</h3>
            <p className="text-xs text-muted-foreground">{fileData.filename}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Create an anchor element and trigger download
              const a = document.createElement('a')
              a.href = fileData.url
              a.download = fileData.filename
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            <span>Download</span>
          </Button>
        </div>
        
        <div className="overflow-hidden rounded-md max-h-[400px] bg-background">
          {isLoadingFile ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center p-4">
              <img src={fileData.url} alt="Verified content" className="max-h-[350px] object-contain" />
            </div>
          ) : isPdf ? (
            <div className="h-[350px]">
              <object 
                data={fileData.url} 
                type="application/pdf" 
                className="w-full h-full"
                aria-label="PDF Preview"
              >
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-muted-foreground">PDF preview not supported in your browser</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4" 
                    onClick={() => window.open(fileData.url, '_blank')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View PDF
                  </Button>
                </div>
              </object>
            </div>
          ) : isHTML ? (
            <div className="h-[350px] bg-white">
              <iframe 
                src={fileData.url} 
                className="w-full h-full border-0" 
                title="HTML Preview"
                sandbox="allow-same-origin"
              ></iframe>
            </div>
          ) : isText || isJSON ? (
            <div className="p-4 font-mono text-sm overflow-auto max-h-[350px]">
              <pre className="whitespace-pre-wrap break-words">
                {/* TextDecoder to convert blob to text */}
                <TextPreview url={fileData.url} />
              </pre>
            </div>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <audio controls className="w-full max-w-md">
                <source src={fileData.url} type={fileData.mimeType} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : isVideo ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <video controls className="max-h-[300px]">
                <source src={fileData.url} type={fileData.mimeType} />
                Your browser does not support the video element.
              </video>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {fileData.mimeType === "application/octet-stream" 
                  ? `File: ${fileData.filename}` 
                  : `File type: ${fileData.mimeType}`}
              </p>
              <p className="text-xs text-muted-foreground mb-4">This file type cannot be previewed</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Create an anchor element and trigger download
                  const a = document.createElement('a')
                  a.href = fileData.url
                  a.download = fileData.filename
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Component to load and display text content
  const TextPreview = ({ url }: { url: string }) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchContent = async () => {
        try {
          const response = await fetch(url);
          const text = await response.text();
          setContent(text);
        } catch (err) {
          console.error("Error fetching text content:", err);
          setError("Failed to load text content");
        }
      };

      fetchContent();
    }, [url]);

    if (error) return <p className="text-destructive">{error}</p>;
    if (!content) return <Loader2 className="h-4 w-4 animate-spin mx-auto" />;
    
    return <>{content}</>;
  };

  // Show loading or connect wallet UI if not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <AnimatedBackground />
        <Navbar />

        <main className="flex-1 flex items-center justify-center py-18">
          <div className="container px-4 md:px-6">
            <div className="glass-card p-8 md:p-12 rounded-lg max-w-md mx-auto">
              <div className="space-y-6 text-center">
                <div className="p-3 mx-auto rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-primary" />
                </div>
                
                <h1 className="text-3xl font-bold">Wallet Connection Required</h1>
                
                <p className="text-muted-foreground">
                  You need to connect your wallet to verify ownership on the blockchain
                </p>

                <Button 
                  className="w-full py-6 text-lg" 
                  onClick={connect} 
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    "Connect with Internet Identity"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 container px-4 md:px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Verify Digital IP</h1>

          <Tabs defaultValue="hash" className="glass-card rounded-lg p-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="hash">Verify by Hash</TabsTrigger>
              <TabsTrigger value="file">Verify by File</TabsTrigger>
            </TabsList>

            <TabsContent value="hash">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hash">File Hash</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hash"
                      placeholder="Enter the SHA-256 hash of the file"
                      value={hash}
                      onChange={(e) => setHash(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleVerify()}
                      disabled={isVerifying || !hash}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : "Verify"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the SHA-256 hash of the file you want to verify
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file">
              <div className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UploadCloud className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Upload File to Verify</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Drag and drop your file here, or click to browse
                      </p>
                    </div>
                    
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => document.getElementById('file')?.click()}
                      variant="outline"
                      className="mt-2"
                    >
                      Choose File
                    </Button>
                    
                    {uploadedFile && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                        <FileIcon className="h-4 w-4 text-primary" />
                        <span>{uploadedFile.name}</span>
                        <span className="text-muted-foreground">({Math.round(uploadedFile.size / 1024)} KB)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleVerifyFile}
                  disabled={isVerifying || isHashing || !uploadedFile}
                  className="w-full"
                >
                  {isHashing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Computing hash...
                    </>
                  ) : isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify File
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Verification Results */}
          {verificationStatus && (
            <div className={`glass-card rounded-lg p-6 mt-6 ${verificationStatus === "success" ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <div className="flex items-center gap-4">
                {verificationStatus === "success" ? (
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <XCircle className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {verificationStatus === "success" ? "Verification Successful" : "Verification Failed"}
                  </h2>
                  <p className="text-muted-foreground">
                    {verificationStatus === "success" 
                      ? "This file's hash was found on the blockchain and is registered as intellectual property."
                      : "No record found for this hash. This file has not been registered or the hash doesn't match."}
                  </p>
                </div>
              </div>

              {verificationStatus === "success" && verificationResult && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Owner</span>
                      <CopyToClipboard 
                        text={verificationResult.owner} 
                        displayText={verificationResult.ownerName}
                        className="hover:text-primary transition-colors"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Registration Date</span>
                      <span>{formatDate(verificationResult.timestamp)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <CopyToClipboard 
                        text={verificationResult.txId} 
                        className="font-mono text-xs hover:text-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard?ipId=${verificationResult.id.toString()}`)}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      View IP Details
                    </Button>
                    
                    {fileData && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = fileData.url
                          a.download = fileData.filename
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display all registrations for the hash */}
          {allRegistrations.length > 0 && (
            <div className="glass-card rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">All Registrations for this File</h2>
              
              <div className="space-y-4">
                {allRegistrations.map((reg, index) => (
                  <div key={index} className={`p-4 rounded-md border ${
                    reg.status === "Verified" ? "border-green-500/30 bg-green-500/5" : 
                    reg.status === "UnderDispute" ? "border-yellow-500/30 bg-yellow-500/5" :
                    reg.status === "Revoked" ? "border-red-500/30 bg-red-500/5" :
                    "border-border bg-card/50"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CopyToClipboard 
                            text={reg.owner}
                            displayText={reg.ownerName}
                            className="font-medium hover:text-primary transition-colors"
                          />
                          {reg.status === "Verified" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {reg.status === "UnderDispute" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {reg.status === "Revoked" && <XCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Registered on {formatDate(reg.timestamp)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard?ipId=${reg.id.toString()}`)}
                          className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadFile(reg.id)}
                          disabled={isLoadingFile}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View File
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Status:</span> {reg.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fileData && renderFilePreview()}
        </div>
      </main>

      <Footer />
    </div>
  )
}

