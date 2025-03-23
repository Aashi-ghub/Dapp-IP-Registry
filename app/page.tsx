import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { Shield, FileCheck, Database, Lock } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col bg-black min-h-screen">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* SVG Arrow Background */}
          <div className="absolute top-[-100px] left-[-100px] z-0 opacity-50 rotate-12 hidden md:block">
            <Image
              src="arrow.svg"
              alt="Arrow Graphic"
              width={400}
              height={400}
              priority
            />
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter glow-text bg-clip-text text-transparent bg-gradient-to-r from-white to-[#0d3ddd] dark:from-white dark:to-[#0d3ddd]">
                  Register & Protect Your Creations on Blockchain
                </h1>
                <p className="text-xl text-muted-foreground">
                  Decentralized, Secure, & Verifiable Intellectual Property Registry on the Internet Computer Protocol
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-md">
                  <Link href="/register">Register Your Work</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-md">
                  <Link href="/verify">Verify Ownership</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
     


        {/* Features Section */}
        <section className="py-12 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">How It Works</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Our platform provides a simple way to register and verify intellectual property on the blockchain
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-lg">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload</h3>
                <p className="text-muted-foreground">Upload your creative work - art, music, documents, or code</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-lg">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hash</h3>
                <p className="text-muted-foreground">We generate a unique cryptographic hash of your file</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-lg">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Register</h3>
                <p className="text-muted-foreground">The hash is stored on the Internet Computer blockchain</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-lg">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Verify</h3>
                <p className="text-muted-foreground">Anyone can verify ownership without revealing your content</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter">Ready to Protect Your Intellectual Property?</h2>
              <p className="text-muted-foreground">
                Join thousands of creators who trust our platform to secure their work on the blockchain
              </p>
              <Button asChild size="lg">
                <Link href="/register">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

