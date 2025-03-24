import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { Shield, FileCheck, Database, Lock, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col bg-black min-h-screen relative overflow-hidden">
      <AnimatedBackground className="fixed inset-0 -z-10" density="low" />
      <Navbar />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-1/3 left-[-10%] w-[40%] h-[30%] rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute bottom-0 right-[-5%] w-[35%] h-[40%] rounded-full bg-blue-500/10 blur-3xl"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-10">
              <div className="space-y-6 max-w-3xl">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter glow-text bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                  Register & Protect Your Creations on Blockchain
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  Decentralized, Secure, & Verifiable Intellectual Property Registry on the Internet Computer Protocol
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <Button asChild size="lg" className="text-md px-8 rounded-full hover-lift">
                  <Link href="/register">Register Your Work</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-md rounded-full group hover-lift">
                  <Link href="/verify" className="flex items-center">
                    Verify Ownership
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-black/30 backdrop-blur-sm relative overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">How It Works</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Our platform provides a simple way to register and verify intellectual property on the blockchain
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="p-5 rounded-full bg-black/40 mb-5 gradient-border">
                  <FileCheck className="h-7 w-7 text-white opacity-90" />
                </div>
                <h3 className="text-xl font-bold mb-3">Upload</h3>
                <p className="text-muted-foreground">Upload your creative work - art, music, documents, or code</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="p-5 rounded-full bg-black/40 mb-5 gradient-border">
                  <Database className="h-7 w-7 text-white opacity-90" />
                </div>
                <h3 className="text-xl font-bold mb-3">Hash</h3>
                <p className="text-muted-foreground">We generate a unique cryptographic hash of your file</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="p-5 rounded-full bg-black/40 mb-5 gradient-border">
                  <Lock className="h-7 w-7 text-white opacity-90" />
                </div>
                <h3 className="text-xl font-bold mb-3">Register</h3>
                <p className="text-muted-foreground">The hash is stored on the Internet Computer blockchain</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 glass-card rounded-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="p-5 rounded-full bg-black/40 mb-5 gradient-border">
                  <Shield className="h-7 w-7 text-white opacity-90" />
                </div>
                <h3 className="text-xl font-bold mb-3">Verify</h3>
                <p className="text-muted-foreground">Verify IP ownership<br />with blockchain proof</p>
              </div>
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 grid-pattern opacity-10"></div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
              <div className="rounded-full p-1.5 px-4 border border-primary/20 bg-primary/5 text-sm text-primary font-medium mb-4">
                Start Protecting Your Work Today
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter glow-text">
                Ready to Protect Your Intellectual Property?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Secure your creations with blockchain technology
              </p>
              <Button asChild size="lg" className="rounded-full px-8 py-6 hover-lift">
                <Link href="/register" className="text-lg">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

