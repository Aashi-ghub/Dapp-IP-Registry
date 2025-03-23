"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { FileUpload } from "@/components/file-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/components/wallet-provider"
import { generateFileHash, registerOnBlockchain } from "@/lib/utils"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const { isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [isGeneratingHash, setIsGeneratingHash] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Redirect to auth if not connected
  if (!isConnected) {
    router.push("/auth")
  }

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile)
    setFileHash(null)
    setTransactionId(null)
  }

  const handleGenerateHash = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a file first",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingHash(true)
    try {
      const hash = await generateFileHash(file)
      setFileHash(hash)
      toast({
        title: "Hash generated",
        description: "Your file hash has been successfully generated",
      })
    } catch (error) {
      toast({
        title: "Error generating hash",
        description: "There was a problem generating the file hash",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingHash(false)
    }
  }

  const handleRegister = async () => {
    if (!fileHash) {
      toast({
        title: "No hash generated",
        description: "Please generate a hash first",
        variant: "destructive",
      })
      return
    }

    if (!title || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsRegistering(true)
    try {
      const metadata = {
        title,
        description,
        category,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        timestamp: new Date().toISOString(),
      }

      const txId = await registerOnBlockchain(fileHash, metadata)
      setTransactionId(txId)
      toast({
        title: "Registration successful",
        description: "Your work has been registered on the blockchain",
      })
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "There was a problem registering your work",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Register Your Work</h1>

            <div className="space-y-8">
              {/* Step 1: Upload File */}
              <div className="glass-card p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Step 1: Upload Your File</h2>
                <FileUpload onFileSelected={handleFileSelected} />
              </div>

              {/* Step 2: Add Metadata */}
              <div className="glass-card p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Step 2: Add Metadata</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter the title of your work"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your work (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="literature">Literature</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="patent">Patent</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Generate Hash */}
              <div className="glass-card p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Step 3: Generate Hash</h2>
                <div className="space-y-4">
                  <Button onClick={handleGenerateHash} disabled={!file || isGeneratingHash} className="w-full">
                    {isGeneratingHash ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Hash...
                      </>
                    ) : (
                      "Generate Hash"
                    )}
                  </Button>

                  {fileHash && (
                    <div className="p-3 bg-muted rounded-md overflow-x-auto">
                      <p className="text-xs font-mono break-all">{fileHash}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Register on Blockchain */}
              <div className="glass-card p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Step 4: Register on Blockchain</h2>
                <div className="space-y-4">
                  <Button
                    onClick={handleRegister}
                    disabled={!fileHash || isRegistering || !title || !category}
                    className="w-full"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering on Blockchain...
                      </>
                    ) : (
                      "Register on Blockchain"
                    )}
                  </Button>

                  {transactionId && (
                    <div className="p-4 bg-primary/10 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <p className="font-medium">Successfully Registered!</p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your work has been permanently registered on the blockchain.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Transaction ID:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{transactionId}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

