import Link from "next/link"
import { Github, Twitter, Heart, Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/20 py-8 bg-background/50 backdrop-blur-sm relative mt-auto">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                IP Registry
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Secure, decentralized intellectual property registration on the Internet Computer blockchain.
            </p>
          </div>
          
          <div className="space-y-4 md:ml-auto md:text-right">
            <h3 className="text-sm font-medium">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Register Works
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Verify Ownership
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse Registry
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dispute Resolution
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} IP Registry
          </p>
          
          <div className="flex items-center text-xs text-muted-foreground order-3 sm:order-2">
            <span>Made with</span>
            <Heart className="h-3 w-3 mx-1 text-red-500" />
            <span>for the ICP Hackathon</span>
          </div>
          
          <div className="flex items-center space-x-4 order-2 sm:order-3">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

