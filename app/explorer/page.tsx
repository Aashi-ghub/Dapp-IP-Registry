"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { useWallet } from "@/components/wallet-provider"
import { icAgent } from "@/lib/ic-agent"
import { IpRecordPublic, IPStatus } from "@/lib/ic-agent"
import { 
  Clock, FileBadge, Shield, Loader2, FileText, ExternalLink, 
  AlertTriangle, User, Calendar, Briefcase, Search, SlidersHorizontal,
  Filter, ArrowDownAZ, Clock5
} from "lucide-react"
import { formatDuration, formatPrincipal } from "@/lib/utils"
import { CopyToClipboard } from "@/components/copy-to-clipboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function ExplorerPage() {
  const { isConnected, principalId } = useWallet()
  const router = useRouter()
  const [ips, setIps] = useState<IpRecordPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, verified, unverified, disputed, revoked
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest")
  const [showFilters, setShowFilters] = useState(false)

  // Redirect to auth if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/auth")
      return
    }

    const fetchIPs = async () => {
      try {
        const data = await icAgent.listAllIPs()
        setIps(data)
      } catch (error) {
        console.error("Error fetching IPs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIPs()
  }, [isConnected, router])

  const getStatusIcon = (status: IPStatus) => {
    if ('Verified' in status) return <Shield className="h-5 w-5 text-green-500" />
    if ('Unverified' in status) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    if ('UnderDispute' in status) return <AlertTriangle className="h-5 w-5 text-red-500" />
    if ('Revoked' in status) return <Shield className="h-5 w-5 text-gray-500" />
    return <FileText className="h-5 w-5" />
  }

  const getStatusText = (status: IPStatus) => {
    if ('Verified' in status) return "Verified"
    if ('Unverified' in status) return "Unverified"
    if ('UnderDispute' in status) return "Under Dispute"
    if ('Revoked' in status) return "Revoked"
    return "Unknown"
  }

  const getStatusColor = (status: IPStatus) => {
    if ('Verified' in status) return "text-green-500"
    if ('Unverified' in status) return "text-yellow-500"
    if ('UnderDispute' in status) return "text-red-500"
    if ('Revoked' in status) return "text-gray-500"
    return ""
  }

  // Apply search query, filter and sort
  const processedIps = ips
    .filter((ip) => {
      // Apply status filter
      if (filter === "all") return true
      if (filter === "verified" && 'Verified' in ip.status) return true
      if (filter === "unverified" && 'Unverified' in ip.status) return true
      if (filter === "disputed" && 'UnderDispute' in ip.status) return true
      if (filter === "revoked" && 'Revoked' in ip.status) return true
      return false
    })
    .filter((ip) => {
      // Apply search query
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        ip.title.toLowerCase().includes(query) || 
        (ip.description && ip.description.toLowerCase().includes(query)) ||
        ip.file_hash.toLowerCase().includes(query) ||
        ip.owner.toString().toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "title") {
        return a.title.localeCompare(b.title)
      } else if (sortBy === "newest") {
        return Number(b.created) - Number(a.created)
      } else if (sortBy === "oldest") {
        return Number(a.created) - Number(b.created)
      }
      return 0
    })

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navbar />
      <AnimatedBackground className="fixed inset-0 -z-10" density="low" />
      
      <main className="flex-1 container px-4 md:px-6 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            IP Explorer
          </h1>
          
          {/* Search and Filters */}
          <div className="mb-10 bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, description, hash, or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/80 border-gray-700 focus-visible:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-shrink-0 border-gray-700 hover:bg-gray-800"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters {filter !== "all" && <Badge className="ml-2 bg-primary">{filter}</Badge>}
                </Button>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="flex-shrink-0 border-gray-700 hover:bg-gray-800"
                    onClick={() => {
                      if (sortBy === "newest") setSortBy("oldest")
                      else if (sortBy === "oldest") setSortBy("title")
                      else setSortBy("newest")
                    }}
                  >
                    {sortBy === "newest" ? (
                      <><Clock5 className="mr-2 h-4 w-4" />Newest</>
                    ) : sortBy === "oldest" ? (
                      <><Clock className="mr-2 h-4 w-4" />Oldest</>
                    ) : (
                      <><ArrowDownAZ className="mr-2 h-4 w-4" />Title</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Filter Options */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-700/50 mt-4 animate-in fade-in-50 duration-100">
                <h2 className="text-md font-medium text-white mb-3 flex items-center">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter by Status
                </h2>
                <div className="flex flex-wrap gap-2">
                  <FilterButton 
                    active={filter === "all"} 
                    onClick={() => setFilter("all")}
                    icon={<Shield className="h-4 w-4" />}
                    label="All"
                    color="bg-gradient-to-r from-primary to-blue-500"
                  />
                  <FilterButton 
                    active={filter === "verified"} 
                    onClick={() => setFilter("verified")}
                    icon={<Shield className="h-4 w-4" />}
                    label="Verified"
                    color="bg-green-500"
                  />
                  <FilterButton 
                    active={filter === "unverified"} 
                    onClick={() => setFilter("unverified")}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Unverified"
                    color="bg-yellow-500"
                  />
                  <FilterButton 
                    active={filter === "disputed"} 
                    onClick={() => setFilter("disputed")}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Disputed"
                    color="bg-red-500"
                  />
                  <FilterButton 
                    active={filter === "revoked"} 
                    onClick={() => setFilter("revoked")}
                    icon={<Shield className="h-4 w-4" />}
                    label="Revoked"
                    color="bg-gray-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-400">
              {processedIps.length === 0
                ? "No results found"
                : `Showing ${processedIps.length} ${processedIps.length === 1 ? "result" : "results"}`}
            </p>
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-white"
              >
                Clear Search
              </Button>
            )}
          </div>
          
          {/* Results */}
          {isLoading ? (
            <div className="flex flex-col h-64 items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <span className="mt-4 text-lg text-gray-300">Loading IP records...</span>
            </div>
          ) : processedIps.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-gray-700/50 bg-gray-800/30 backdrop-blur-sm p-8 text-center">
              <div className="bg-gray-800/80 p-6 rounded-full mb-2">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white">No IP records found</h3>
              <p className="text-sm text-gray-400 max-w-md">
                {filter !== "all" 
                  ? `No ${filter} intellectual properties found. Try adjusting your filters or search query.` 
                  : searchQuery 
                    ? "No matching intellectual properties found. Try a different search term."
                    : "There are no intellectual properties registered in the system yet."}
              </p>
              {(filter !== "all" || searchQuery) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setFilter("all")
                    setSearchQuery("")
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {processedIps.map((ip) => (
                <div 
                  key={ip.id.toString()}
                  className="group flex flex-col rounded-xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm p-6 shadow-md transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-gray-600/70"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-lg line-clamp-1 text-white group-hover:text-primary transition-colors" title={ip.title}>
                      {ip.title}
                    </h3>
                    <div className={`flex items-center ${getStatusColor(ip.status)} px-2 py-1 rounded-full bg-black/30`}>
                      {getStatusIcon(ip.status)}
                      <span className="ml-1.5 text-sm font-medium">{getStatusText(ip.status)}</span>
                    </div>
                  </div>
                  
                  <p className="mb-4 flex-1 text-sm text-gray-300 line-clamp-2" title={ip.description}>
                    {ip.description || "No description provided"}
                  </p>
                  
                  <div className="mt-auto space-y-3 pt-4 text-sm text-gray-400 bg-gray-900/40 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <User className="h-3.5 w-3.5 mr-2 opacity-70" />
                        Owner:
                      </span>
                      <CopyToClipboard 
                        text={ip.owner.toString()} 
                        displayText={formatPrincipal(ip.owner.toString())}
                        className="text-gray-300 hover:text-primary transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-2 opacity-70" />
                        Created:
                      </span>
                      <span className="text-gray-300">{formatDuration(Number(ip.created))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Briefcase className="h-3.5 w-3.5 mr-2 opacity-70" />
                        Licenses:
                      </span>
                      <span className="text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded-full min-w-[24px] text-center">{ip.licenses.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-2 opacity-70" />
                        Disputes:
                      </span>
                      <span className="text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded-full min-w-[24px] text-center">{ip.disputes.length}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="outline" 
                      className="flex-1 hover:bg-primary/10 border-gray-700/50 group-hover:border-primary/40 transition-colors"
                      onClick={() => router.push(`/dashboard?ipId=${ip.id.toString()}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                      View Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-yellow-600/10 border-gray-700/50 group-hover:border-yellow-500/40 transition-colors"
                      onClick={() => router.push(`/verify?hash=${ip.file_hash}`)}
                    >
                      <Shield className="mr-2 h-4 w-4 text-yellow-500" />
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Filter Button Component
function FilterButton({ active, onClick, icon, label, color }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 transition-all flex items-center gap-2 text-sm font-medium",
        active 
          ? `shadow-lg ${color} text-white scale-[1.03]` 
          : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:scale-[1.02]"
      )}
    >
      {icon}
      {label}
    </button>
  )
} 