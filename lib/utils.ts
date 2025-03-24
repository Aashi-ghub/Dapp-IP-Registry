import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { icAgent } from "./ic-agent"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a real file hash using SHA-256
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer
        if (!arrayBuffer) {
          throw new Error("Failed to read file")
        }
        
        // Use Web Crypto API to create a SHA-256 hash
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
        
        // Convert the hash to a hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
        
        // Simulate network delay for UI
        setTimeout(() => {
          resolve(hashHex)
        }, 500)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

// Register IP on the blockchain
export async function registerOnBlockchain(hash: string, metadata: { title: string, description: string }): Promise<string> {
  try {
    const ipId = await icAgent.createIpRecord(metadata.title, metadata.description, hash)
    if (!ipId) {
      throw new Error("Failed to create IP record")
    }
    return ipId.toString()
  } catch (error) {
    console.error("Error registering on blockchain:", error)
    throw error
  }
}

// Upload a file to the blockchain in chunks
export async function uploadFileChunks(file: File, ipId: string): Promise<boolean> {
  try {
    const CHUNK_SIZE = 500 * 1024 // 500KB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    
    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}, chunks: ${totalChunks}`)
    
    // Determine the proper MIME type for the file
    const mimeType = file.type || getMimeTypeFromFilename(file.name)
    
    // Read and upload each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(file.size, start + CHUNK_SIZE)
      const chunk = file.slice(start, end)
      
      // Convert chunk to Uint8Array
      const arrayBuffer = await chunk.arrayBuffer()
      const chunkData = new Uint8Array(arrayBuffer)
      
      console.log(`Uploading chunk ${i+1}/${totalChunks}: ${chunkData.length} bytes`)
      
      // Upload the chunk
      const success = await icAgent.uploadChunk(BigInt(ipId), i, chunkData)
      if (!success) {
        console.error(`Failed to upload chunk ${i}`)
        throw new Error(`Failed to upload chunk ${i}`)
      }
    }
    
    // Finish the upload
    const success = await icAgent.finishUpload(BigInt(ipId), file.size)
    if (!success) {
      console.error(`Failed to finish upload for ${file.name}`)
      return false
    }
    
    // Store file metadata securely
    const metadataSuccess = await icAgent.updateFileMetadata(
      BigInt(ipId),
      file.name,
      mimeType,
      file.size
    )
    
    if (!metadataSuccess) {
      console.warn("Failed to update file metadata, downloads may have incorrect filenames or MIME types")
    }
    
    console.log(`File upload completed successfully: ${file.name}`)
    return true
  } catch (error) {
    console.error("Error uploading file chunks:", error)
    return false
  }
}

// Helper function to guess MIME type from filename
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  
  return mimeTypes[extension] || 'application/octet-stream'
}

// Verify IP on the blockchain
export async function verifyOnBlockchain(hash: string): Promise<any | null> {
  try {
    // In a real scenario, we would search for the IP by hash
    // For now, get all IPs and filter by hash
    const ips = await icAgent.listAllIPs()
    const matchingIp = ips.find(ip => ip.file_hash === hash)
    
    if (matchingIp) {
      const owner = matchingIp.owner.toString()
      return {
        owner,
        ownerName: `${owner.substring(0, 5)}...${owner.substring(owner.length - 5)}`,
        timestamp: Number(matchingIp.created),
        txId: matchingIp.id.toString(),
        id: matchingIp.id, // Include the IP ID for file retrieval
      }
    }
    
    return null
  } catch (error) {
    console.error("Error verifying on blockchain:", error)
    return null
  }
}

// Get file data by IP ID
export async function getFileFromBlockchain(ipId: bigint): Promise<{url: string, mimeType: string, filename: string} | null> {
  try {
    const fileData = await icAgent.getFileChunks(ipId)
    
    if (!fileData) {
      return null
    }
    
    // Use the metadata from the blockchain directly
    let filename = fileData.filename
    let mimeType = fileData.mimeType
    
    // Fallback: Make sure filename has an extension if it's missing
    if (!filename.includes('.')) {
      const extension = getExtensionFromMimeType(mimeType)
      filename = `${filename}.${extension}`
    }
    
    // Fallback: Determine MIME type from extension if we have an application/octet-stream type
    if (mimeType === "application/octet-stream") {
      const extension = filename.split('.').pop()?.toLowerCase() || ''
      const detectedMimeType = getMimeTypeFromExtension(extension)
      if (detectedMimeType !== "application/octet-stream") {
        mimeType = detectedMimeType
      }
    }
    
    // Create a blob with the correct MIME type
    const blob = new Blob([fileData.data], { type: mimeType })
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob)
    
    return {
      url,
      mimeType,
      filename
    }
  } catch (error) {
    console.error("Error getting file from blockchain:", error)
    return null
  }
}

// Helper function to get MIME type from extension
function getMimeTypeFromExtension(extension: string): string {
  return getMimeTypeFromFilename(`file.${extension}`)
}

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeTypeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/zip': 'zip',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
  }
  
  return mimeTypeMap[mimeType] || 'bin'
}

/**
 * Format a timestamp to a relative time (e.g. "2 days ago")
 * Handles Internet Computer timestamps which are in nanoseconds
 */
export function formatDuration(timestamp: number): string {
  const now = Date.now();
  // Convert from nanoseconds to milliseconds if needed
  const timestampInMs = timestamp > 1000000000000000 ? Math.floor(timestamp / 1000000) : timestamp;
  const milliseconds = now - timestampInMs;
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * Format a principal ID to a shorter format (e.g. "abcd...wxyz")
 */
export function formatPrincipal(principal: string): string {
  if (!principal) return '';
  
  // Remove any "Principal" prefix if present
  const cleanPrincipal = principal.replace(/^Principal\s*"?([^"]+)"?$/, '$1');
  
  if (cleanPrincipal.length <= 10) return cleanPrincipal;
  
  return `${cleanPrincipal.substring(0, 5)}...${cleanPrincipal.substring(cleanPrincipal.length - 5)}`;
}

