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
import { generateFileHash, registerOnBlockchain, uploadFileChunks } from "@/lib/utils"
import { Loader2, CheckCircle2, Shield, UploadCloud, FileText } from "lucide-react"
import { CopyToClipboard } from "@/components/copy-to-clipboard"
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
  const [isUploading, setIsUploading] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [registrationStep, setRegistrationStep] = useState<'idle' | 'hashing' | 'registering' | 'uploading' | 'complete' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redirect to auth if not connected
  if (!isConnected) {
    router.push("/auth")
  }

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile)
    setFileHash(null)
    setTransactionId(null)
    setUploadComplete(false)
    setRegistrationStep('idle')
    setErrorMessage(null)
  }

  const resetForm = () => {
    setFile(null)
    setFileHash(null)
    setTransactionId(null)
    setUploadComplete(false)
    setTitle("")
    setDescription("")
    setCategory("")
    setRegistrationStep('idle')
    setErrorMessage(null)
  }

  const handleRegisterAll = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a file first",
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

    setErrorMessage(null)
    
    try {
      // Step 1: Generate hash
      setRegistrationStep('hashing')
      setIsGeneratingHash(true)
      const hash = await generateFileHash(file)
      setFileHash(hash)
      setIsGeneratingHash(false)
      
      // Step 2: Register on blockchain
      setRegistrationStep('registering')
      setIsRegistering(true)
      const metadata = {
        title,
        description,
      }
      const ipId = await registerOnBlockchain(hash, metadata)
      setTransactionId(ipId)
      setIsRegistering(false)
      
      // Step 3: Upload file chunks if registration was successful
      if (ipId) {
        setRegistrationStep('uploading')
        setIsUploading(true)
        const success = await uploadFileChunks(file, ipId)
        setUploadComplete(success)
        setIsUploading(false)
        
        if (success) {
          setRegistrationStep('complete')
          toast({
            title: "Registration complete",
            description: "Your work has been successfully registered and uploaded to the blockchain",
          })
        } else {
          toast({
            title: "Upload failed",
            description: "Registration successful but file upload failed",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred"
      setErrorMessage(errorMsg)
      toast({
        title: "Registration failed",
        description: "There was a problem during the registration process",
        variant: "destructive",
      })
      setRegistrationStep('error')
    } finally {
      setIsGeneratingHash(false)
      setIsRegistering(false)
      setIsUploading(false)
    }
  }

  // Determine if form is complete
  const isFormComplete = !!file && !!title && !!category

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Register Your Work</h1>

            <div className="space-y-8">
              {/* Step 1: Upload File */}
              <div className={`glass-card p-6 rounded-lg ${!file && registrationStep === 'idle' ? 'ring-2 ring-primary/50' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Step 1: Upload Your File</h2>
                <FileUpload onFileSelected={handleFileSelected} />
                {file && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
                  </div>
                )}
              </div>

              {/* Step 2: Add Metadata */}
              <div className={`glass-card p-6 rounded-lg ${file && (!title || !category) && registrationStep === 'idle' ? 'ring-2 ring-primary/50' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Step 2: Add Metadata</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center">
                        Title <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter the title of your work"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={!title && file ? "border-red-500/50 focus-visible:ring-red-500/30" : ""}
                      />
                      {!title && file && (
                        <p className="text-xs text-red-500">Title is required</p>
                      )}
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
                      <Label htmlFor="category" className="flex items-center">
                        Category <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger 
                          id="category"
                          className={!category && file ? "border-red-500/50 ring-red-500/30" : ""}
                        >
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
                      {!category && file && (
                        <p className="text-xs text-red-500">Category is required</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Register on Blockchain */}
              <div className={`glass-card p-6 rounded-lg ${isFormComplete && registrationStep === 'idle' ? 'ring-2 ring-primary/50' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Step 3: Register on Blockchain</h2>
                
                {registrationStep === 'idle' ? (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <div className="space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Ready to Register</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Register your work on the blockchain to protect your intellectual property
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleRegisterAll}
                      disabled={!isFormComplete || isGeneratingHash || isRegistering || isUploading}
                      className="w-full h-11"
                    >
                      {!file ? "Upload a file first" : 
                      !title || !category ? "Complete all required fields" : 
                      "Register on Blockchain"}
                    </Button>
                  </div>
                ) : registrationStep !== 'complete' && registrationStep !== 'error' && !transactionId ? (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="w-full bg-gray-900/50 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: registrationStep === 'hashing' ? '33%' : 
                                   registrationStep === 'registering' ? '66%' : 
                                   registrationStep === 'uploading' ? '90%' : '0%' 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div className={`flex flex-col items-center ${registrationStep === 'hashing' || registrationStep === 'registering' || registrationStep === 'uploading' ? 'text-primary' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${registrationStep === 'hashing' ? 'bg-primary text-white' : 'bg-muted'}`}>
                            {isGeneratingHash ? <Loader2 className="h-3 w-3 animate-spin" /> : "1"}
                          </div>
                          <span>Generate Hash</span>
                        </div>
                        <div className={`flex flex-col items-center ${registrationStep === 'registering' || registrationStep === 'uploading' ? 'text-primary' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${registrationStep === 'registering' ? 'bg-primary text-white' : 'bg-muted'}`}>
                            {isRegistering ? <Loader2 className="h-3 w-3 animate-spin" /> : "2"}
                          </div>
                          <span>Register</span>
                        </div>
                        <div className={`flex flex-col items-center ${registrationStep === 'uploading' ? 'text-primary' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${registrationStep === 'uploading' ? 'bg-primary text-white' : 'bg-muted'}`}>
                            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "3"}
                          </div>
                          <span>Upload</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 mr-3 text-primary animate-spin" />
                        <div>
                          <h4 className="font-medium">
                            {registrationStep === 'hashing' ? 'Computing hash...' : 
                             registrationStep === 'registering' ? 'Registering on blockchain...' : 
                             'Uploading file...'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {registrationStep === 'hashing' ? 'Generating a unique fingerprint of your file.' : 
                             registrationStep === 'registering' ? 'Registering your intellectual property on the blockchain.' : 
                             'Uploading your file securely to the blockchain.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : registrationStep === 'error' ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg">
                    <div className="flex items-start">
                      <div className="bg-red-500/20 rounded-full p-2 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="h-6 w-6 text-red-500">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-medium text-red-500 mb-2">Registration Failed</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {errorMessage || "There was a problem during the registration process. Please try again."}
                        </p>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setRegistrationStep('idle')}
                            className="flex-1"
                          >
                            Try Again
                          </Button>
                          <Button
                            onClick={resetForm}
                            variant="outline"
                            className="flex-1"
                          >
                            Start Over
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : registrationStep === 'complete' && uploadComplete ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-lg">
                    <div className="flex items-start">
                      <div className="bg-green-500/20 rounded-full p-2 mr-4">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-medium text-green-500 mb-2">Registration Successful!</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Your intellectual property has been securely registered on the blockchain and is now protected.
                        </p>
                        
                        <div className="space-y-3 bg-black/20 p-4 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Transaction ID:</span>
                            <CopyToClipboard 
                              text={transactionId || ""}
                              displayText={transactionId || ""}
                              className="font-mono text-xs text-gray-300 hover:text-primary transition-colors overflow-x-auto"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">File Hash:</span>
                            <CopyToClipboard 
                              text={fileHash || ""}
                              displayText={fileHash || ""}
                              className="font-mono text-xs text-gray-300 hover:text-primary transition-colors overflow-x-auto"
                            />
                          </div>
                          
                          <div className="flex items-center text-green-400 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span>File uploaded and verified successfully</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => router.push(`/dashboard?ipId=${transactionId}`)}
                            className="flex-1"
                          >
                            View Your IP
                          </Button>
                          <Button
                            onClick={resetForm}
                            variant="outline"
                            className="flex-1"
                          >
                            Register Another
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 mr-3 text-primary animate-spin" />
                      <div>
                        <h4 className="font-medium">Finalizing registration...</h4>
                        <p className="text-sm text-muted-foreground">
                          Your intellectual property has been registered, completing file upload and verification.
                        </p>
                        {transactionId && (
                          <div className="mt-3 text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto">
                            Transaction ID: <span className="text-primary">{transactionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

