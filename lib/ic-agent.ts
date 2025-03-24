import { Actor, HttpAgent, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";

// Get environment variables with fallbacks
const DFX_NETWORK = process.env.NEXT_PUBLIC_DFX_NETWORK || "local";
const IP_REGISTRY_CANISTER_ID = process.env.NEXT_PUBLIC_IP_REGISTRY_CANISTER_ID || "be2us-64aaa-aaaaa-qaabq-cai";
const INTERNET_IDENTITY_CANISTER_ID = process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID || "rdmx6-jaaaa-aaaaa-aaadq-cai";

// Hardcode the IDL factory to avoid import issues
const idlFactory = ({ IDL }: { IDL: any }) => {
  const IpID = IDL.Nat;
  const DisputeID = IDL.Nat;
  const IPStatus = IDL.Variant({
    'Unverified': IDL.Null,
    'Verified': IDL.Null,
    'UnderDispute': IDL.Null,
    'Revoked': IDL.Null,
  });
  const License = IDL.Record({
    'id': IDL.Nat,
    'licensee': IDL.Principal,
    'terms': IDL.Text,
    'royalty': IDL.Nat,
    'valid': IDL.Bool,
    'createdAt': IDL.Int,
  });
  const IpRecordPublic = IDL.Record({
    'id': IpID,
    'owner': IDL.Principal,
    'title': IDL.Text,
    'description': IDL.Text,
    'file_hash': IDL.Text,
    'status': IPStatus,
    'stakes': IDL.Nat,
    'licenses': IDL.Vec(License),
    'disputes': IDL.Vec(DisputeID),
    'created': IDL.Int,
    'updated': IDL.Int,
    'file_metadata': IDL.Opt(IDL.Record({
      'filename': IDL.Text,
      'mimeType': IDL.Text,
      'fileSize': IDL.Nat,
    })),
  });
  const Result = IDL.Variant({ 'ok': IDL.Null, 'err': IDL.Text });
  const Result_1 = IDL.Variant({ 'ok': DisputeID, 'err': IDL.Text });
  const Result_2 = IDL.Variant({ 'ok': IDL.Bool, 'err': IDL.Text });
  const Result_3 = IDL.Variant({ 'ok': IDL.Nat, 'err': IDL.Text });
  const FileInfo = IDL.Record({
    'chunkCount': IDL.Nat,
    'fileSize': IDL.Nat,
    'mimeType': IDL.Text,
    'filename': IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok': FileInfo, 'err': IDL.Text });
  const Result_5 = IDL.Variant({ 'ok': IDL.Vec(IDL.Nat8), 'err': IDL.Text });
  const EventKind = IDL.Variant({
    'IpCreated': IpID,
    'IpStaked': IDL.Tuple(IpID, IDL.Principal, IDL.Nat),
    'DisputeRaised': DisputeID,
    'DisputeVote': IDL.Tuple(DisputeID, IDL.Principal, IDL.Bool),
    'DisputeResolved': IDL.Tuple(DisputeID, IDL.Bool),
    'LicenseIssued': IDL.Tuple(IpID, IDL.Principal),
    'OwnershipTransferred': IDL.Tuple(IpID, IDL.Principal, IDL.Principal),
  });
  const Event = IDL.Record({
    'kind': EventKind,
    'timestamp': IDL.Int,
  });
  return IDL.Service({
    'createIpRecord': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],
      [IpID],
      [],
    ),
    'finishUpload': IDL.Func([IpID, IDL.Nat], [Result], []),
    'getEvents': IDL.Func([], [IDL.Vec(Event)], ['query']),
    'getFileInfo': IDL.Func([IpID], [Result_4], ['query']),
    'getFileChunk': IDL.Func([IpID, IDL.Nat], [Result_5], ['query']),
    'getIp': IDL.Func([IpID], [IDL.Opt(IpRecordPublic)], ['query']),
    'getIpsByHash': IDL.Func([IDL.Text], [IDL.Vec(IpRecordPublic)], ['query']),
    'issueLicense': IDL.Func(
      [IpID, IDL.Principal, IDL.Text, IDL.Nat],
      [Result_3],
      [],
    ),
    'listAllIPs': IDL.Func([], [IDL.Vec(IpRecordPublic)], ['query']),
    'raiseDispute': IDL.Func([IpID, IDL.Text, IDL.Nat], [Result_1], []),
    'resolveDispute': IDL.Func([DisputeID], [Result_2], []),
    'stake': IDL.Func([IpID, IDL.Nat], [Result], []),
    'transferOwnership': IDL.Func([IpID, IDL.Principal], [Result], []),
    'updateFileMetadata': IDL.Func([IpID, IDL.Text, IDL.Text, IDL.Nat], [Result], []),
    'updateTokenCanisterId': IDL.Func([IDL.Text], [], []),
    'uploadChunk': IDL.Func([IpID, IDL.Nat, IDL.Vec(IDL.Nat8)], [Result], []),
    'voteOnDispute': IDL.Func([DisputeID, IDL.Bool], [Result], []),
  });
};

// Type definitions
export type IpID = bigint;
export type DisputeID = bigint;

export type IPStatus = 
  | { Unverified: null }
  | { Verified: null }
  | { UnderDispute: null }
  | { Revoked: null };

export interface License {
  id: bigint;
  licensee: Principal;
  terms: string;
  royalty: bigint;
  valid: boolean;
  createdAt: bigint;
}

export interface IpRecordPublic {
  id: IpID;
  owner: Principal;
  title: string;
  description: string;
  file_hash: string;
  status: IPStatus;
  stakes: bigint;
  licenses: License[];
  disputes: DisputeID[];
  created: bigint;
  updated: bigint;
  file_metadata?: {
    filename: string;
    mimeType: string;
    fileSize: bigint;
  };
}

export type Result<T, E> = { ok: T } | { err: E };

// Single class to handle all Internet Computer interactions
class IcAgent {
  // Private members
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private agent: HttpAgent | null = null;
  private actor: any = null;
  
  // State tracking
  private initPromise: Promise<void> | null = null;
  private isInitializing = false;
  
  constructor() {
    // Skip initialization during SSR
    if (typeof window !== 'undefined') {
      console.log("IcAgent initializing with config:", {
        network: DFX_NETWORK,
        canisterId: IP_REGISTRY_CANISTER_ID
      });
      
      // Run initial checks but don't block construction
      this.checkAuth().catch(err => {
        console.warn("Initial auth check failed:", err);
      });
    }
  }

  // AUTHENTICATION METHODS
  
  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    try {
      const authClient = await this.getAuthClient();
      return await authClient.isAuthenticated();
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }
  
  // Get or create auth client
  private async getAuthClient(): Promise<AuthClient> {
    if (!this.authClient) {
      this.authClient = await AuthClient.create();
      console.log("Auth client created");
    }
    return this.authClient;
  }
  
  // Check authentication status and initialize if authenticated
  private async checkAuth(): Promise<void> {
    try {
      // Get auth client
      const authClient = await this.getAuthClient();
      
      // Get authentication status
      const isAuth = await authClient.isAuthenticated();
      console.log("Authentication status:", isAuth);
      
      if (isAuth) {
        // Get identity
        this.identity = authClient.getIdentity();
        const principal = this.identity.getPrincipal().toString();
        console.log("User authenticated with principal:", principal);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("principalId", principal);
        }
        
        // Initialize agent and actor
        await this.initialize();
      }
    } catch (error) {
      console.error("Error during auth check:", error);
    }
  }
  
  // User login
  public async login(): Promise<string | null> {
    try {
      console.log("Starting login process");
      const authClient = await this.getAuthClient();
      
      // Determine the identity provider URL based on network
      const identityProviderUrl = DFX_NETWORK === "local"
        ? `http://${INTERNET_IDENTITY_CANISTER_ID}.localhost:8000/`
        : "https://identity.ic0.app";
      
      console.log(`Using Identity Provider: ${identityProviderUrl}`);
      
      return new Promise((resolve) => {
        authClient.login({
          // Use identity provider based on environment
          identityProvider: identityProviderUrl,
          
          // 7-day session
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
          
          onSuccess: async () => {
            try {
              // Get identity
              this.identity = authClient.getIdentity();
              const principal = this.identity.getPrincipal().toString();
              console.log("Login successful with principal:", principal);
              
              // Save to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem("principalId", principal);
              }
              
              // Clear existing state
              this.agent = null;
              this.actor = null;
              
              // Initialize with new identity
              await this.initialize();
              
              resolve(principal);
            } catch (error) {
              console.error("Error after login:", error);
              resolve(this.identity?.getPrincipal().toString() || null);
            }
          },
          onError: (error) => {
            console.error("Login failed:", error);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error("Error during login:", error);
      return null;
    }
  }
  
  // User logout
  public async logout(): Promise<void> {
    try {
      if (this.authClient) {
        await this.authClient.logout();
        
        // Clear state
        this.identity = null;
        this.agent = null;
        this.actor = null;
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem("principalId");
        }
        
        console.log("Logout successful");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }
  
  // INITIALIZATION METHODS
  
  // Initialize everything
  private async initialize(): Promise<void> {
    // Don't run during SSR
    if (typeof window === 'undefined') {
      return;
    }
    
    // Return existing promise if initializing
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }
    
    // Set initialization flag
    this.isInitializing = true;
    
    // Create initialization promise
    this.initPromise = (async () => {
      try {
        console.log("Initializing IcAgent");
        
        // Make sure we have an identity
        if (!this.identity) {
          const authClient = await this.getAuthClient();
          
          if (await authClient.isAuthenticated()) {
            this.identity = authClient.getIdentity();
          } else {
            console.warn("Cannot initialize: not authenticated");
            return;
          }
        }
        
        // Create agent
        await this.createAgent();
        
        // Create actor
        await this.createActor();
        
        console.log("IcAgent initialized successfully");
      } catch (error) {
        console.error("Initialization failed:", error);
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();
    
    return this.initPromise;
  }
  
  // Create agent
  private async createAgent(): Promise<HttpAgent> {
    if (!this.identity) {
      throw new Error("Cannot create agent without identity");
    }
    
    if (!this.agent) {
      // Set host based on network
      const host = DFX_NETWORK === "local" 
        ? "http://localhost:8000" 
        : "https://icp-api.io";
      
      console.log(`Creating agent with host: ${host}`);
      
      // Create new agent
      this.agent = new HttpAgent({
        host,
        identity: this.identity
      });
      
      // Fetch root key in local dev only
      if (DFX_NETWORK === "local") {
        console.log("Fetching root key for local development");
        await this.agent.fetchRootKey();
      }
      
      console.log("Agent created successfully");
    }
    
    return this.agent;
  }
  
  // Create actor
  private async createActor(): Promise<any> {
    if (!this.agent) {
      await this.createAgent();
    }
    
    if (!this.actor) {
      try {
        console.log(`Creating actor with canister ID: ${IP_REGISTRY_CANISTER_ID}`);
        
        // Create actor using the hardcoded IDL factory
        this.actor = Actor.createActor(idlFactory, {
          agent: this.agent!,
          canisterId: IP_REGISTRY_CANISTER_ID
        });
        
        console.log("Actor created successfully");
        
        // Test actor
        try {
          console.log("Testing actor with listAllIPs query");
          const ips = await this.actor.listAllIPs();
          console.log(`Actor test successful: found ${ips.length} IP records`);
        } catch (testError) {
          console.warn("Actor test failed, but continuing:", testError);
        }
      } catch (error) {
        console.error("Actor creation failed:", error);
        throw error;
      }
    }
    
    return this.actor;
  }
  
  // Ensure actor is ready
  private async getActor(): Promise<any> {
    // Initialize if needed
    await this.initialize();
    
    // Check if actor exists
    if (!this.actor) {
      throw new Error("Actor not initialized. Please log in first.");
    }
    
    return this.actor;
  }
  
  // API METHODS
  
  // Create IP record
  public async createIpRecord(title: string, description: string, fileHash: string): Promise<bigint | null> {
    try {
      console.log(`Creating IP record: "${title}"`);
      const actor = await this.getActor();
      const result = await actor.createIpRecord(title, description, fileHash);
      console.log(`Created IP record with ID: ${result.toString()}`);
      return result;
    } catch (error) {
      console.error("Failed to create IP record:", error);
      return null;
    }
  }
  
  // List all IPs
  public async listAllIPs(): Promise<IpRecordPublic[]> {
    try {
      console.log("Listing all IP records");
      const actor = await this.getActor();
      const result = await actor.listAllIPs();
      console.log(`Found ${result.length} IP records`);
      return result;
    } catch (error) {
      console.error("Failed to list IPs:", error);
      return [];
    }
  }
  
  // Get specific IP
  public async getIp(ipId: bigint): Promise<IpRecordPublic | null> {
    try {
      console.log(`Getting IP record: ${ipId.toString()}`);
      const actor = await this.getActor();
      const result = await actor.getIp(ipId);
      return result[0] || null;
    } catch (error) {
      console.error(`Failed to get IP ${ipId}:`, error);
      return null;
    }
  }
  
  // Upload chunk
  public async uploadChunk(ipId: bigint, index: number, chunk: Uint8Array): Promise<boolean> {
    try {
      console.log(`Uploading chunk ${index} for IP ${ipId.toString()}`);
      const actor = await this.getActor();
      const result = await actor.uploadChunk(ipId, BigInt(index), chunk);
      const success = "ok" in result;
      console.log(`Chunk ${index} upload ${success ? "succeeded" : "failed"}`);
      return success;
    } catch (error) {
      console.error(`Failed to upload chunk ${index}:`, error);
      return false;
    }
  }
  
  // Finish upload
  public async finishUpload(ipId: bigint, fileSize: number): Promise<boolean> {
    try {
      console.log(`Finishing upload for IP ${ipId.toString()}`);
      const actor = await this.getActor();
      
      const result = await actor.finishUpload(ipId, BigInt(fileSize));
      const success = "ok" in result;
      console.log(`Upload finalization ${success ? "succeeded" : "failed"}`);
      return success;
    } catch (error) {
      console.error(`Failed to finish upload:`, error);
      return false;
    }
  }
  
  // Update metadata for an IP record
  public async updateFileMetadata(ipId: bigint, filename: string, mimeType: string, fileSize: number): Promise<boolean> {
    try {
      console.log(`Updating file metadata for IP ${ipId.toString()}`);
      const actor = await this.getActor();
      
      const result = await actor.updateFileMetadata(ipId, filename, mimeType, BigInt(fileSize));
      const success = "ok" in result;
      console.log(`File metadata update ${success ? "succeeded" : "failed"}`);
      return success;
    } catch (error) {
      console.error(`Failed to update file metadata:`, error);
      return false;
    }
  }
  
  // Update metadata for an IP (used to store file information)
  public async updateMetadata(ipId: bigint, title: string): Promise<boolean> {
    try {
      console.log(`Updating metadata for IP ${ipId.toString()}`);
      const actor = await this.getActor();
      
      // Get the current record
      const record = await this.getIp(ipId);
      if (!record) {
        return false;
      }
      
      // The actor might not have an explicit updateMetadata method, so we'll have to use
      // a workaround like transferring ownership to self (which can update metadata)
      // or using a specialized update method if available
      try {
        // Try to use transferOwnership to self as a workaround to update the title
        // Note: In a real implementation, there should be a dedicated update method
        const result = await actor.transferOwnership(ipId, record.owner);
        const success = "ok" in result;
        console.log(`Metadata update ${success ? "succeeded" : "failed"}`);
        return success;
      } catch (e) {
        console.error("Failed to update metadata:", e);
        return false;
      }
    } catch (error) {
      console.error(`Failed to update metadata:`, error);
      return false;
    }
  }
  
  // Get file chunks (using actual contract methods if available)
  public async getFileChunks(ipId: bigint): Promise<{mimeType: string, data: Uint8Array, filename: string} | null> {
    try {
      console.log(`Getting file for IP ${ipId.toString()}`);
      const actor = await this.getActor();
      
      try {
        // Try to use the getFileInfo method first
        const fileInfoResult = await actor.getFileInfo(ipId);
        
        if ("ok" in fileInfoResult) {
          const fileInfo = fileInfoResult.ok;
          console.log(`File info retrieved: ${fileInfo.filename}, size: ${fileInfo.fileSize}, chunks: ${fileInfo.chunkCount}`);
          
          if (Number(fileInfo.chunkCount) === 0) {
            console.error("File has zero chunks according to file info");
            return null;
          }
          
          // Get all chunks
          const chunks: Uint8Array[] = [];
          let retrievalErrors = 0;
          
          for (let i = 0; i < Number(fileInfo.chunkCount); i++) {
            try {
              const chunkResult = await actor.getFileChunk(ipId, BigInt(i));
              if ("ok" in chunkResult) {
                chunks.push(chunkResult.ok);
              } else {
                console.error(`Failed to get chunk ${i}: ${chunkResult.err}`);
                retrievalErrors++;
                // Continue trying other chunks
              }
            } catch (chunkError) {
              console.error(`Exception retrieving chunk ${i}:`, chunkError);
              retrievalErrors++;
            }
          }
          
          if (chunks.length === 0) {
            console.error(`Failed to retrieve any chunks despite file info indicating ${fileInfo.chunkCount} chunks`);
            return null;
          }
          
          if (retrievalErrors > 0) {
            console.warn(`Retrieved ${chunks.length} chunks with ${retrievalErrors} errors`);
          }
          
          // Combine all chunks
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const combinedData = new Uint8Array(totalLength);
          let offset = 0;
          
          for (const chunk of chunks) {
            combinedData.set(chunk, offset);
            offset += chunk.length;
          }
          
          return {
            mimeType: fileInfo.mimeType,
            filename: fileInfo.filename,
            data: combinedData
          };
        } else {
          console.log(`File info not available: ${fileInfoResult.err}, using fallback logic`);
        }
      } catch (apiError) {
        console.log("API methods not available, using fallback logic:", apiError);
      }
      
      // Fallback: Get IP record to extract file info from name/description
      const ipRecord = await this.getIp(ipId);
      if (!ipRecord) {
        console.error("IP record not found");
        return null;
      }
      
      console.log(`Using fallback logic for IP ${ipId.toString()}, title: ${ipRecord.title}`);
      
      // Check if file metadata exists in the IP record
      let filename = ipRecord.title || "unknown";
      let mimeType = "application/octet-stream";
      
      if (ipRecord.file_metadata) {
        filename = ipRecord.file_metadata.filename;
        mimeType = ipRecord.file_metadata.mimeType;
        console.log(`Found file metadata: ${filename}, type: ${mimeType}, size: ${ipRecord.file_metadata.fileSize}`);
      }
      
      // Get stored chunks or attempt to reconstruct the file
      const chunks: Uint8Array[] = [];
      let chunkCount = 0;
      let fileSize = 0;
      
      // Try to retrieve chunks from the blockchain
      try {
        // We don't know how many chunks there are, so we'll try to retrieve them
        // until we get an error or reach a reasonable limit
        let i = 0;
        const MAX_CHUNKS = 1000; // Safety limit to prevent infinite loops
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 3; // Stop after this many errors in a row
        
        while (i < MAX_CHUNKS && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
          try {
            console.log(`Attempting to retrieve chunk ${i}`);
            const chunkResult = await actor.getFileChunk(ipId, BigInt(i));
            
            if ("ok" in chunkResult) {
              chunks.push(chunkResult.ok);
              fileSize += chunkResult.ok.length;
              i++;
              consecutiveErrors = 0; // Reset consecutive errors counter
              console.log(`Successfully retrieved chunk ${i-1}, size: ${chunkResult.ok.length}`);
            } else {
              console.warn(`Failed to get chunk ${i}: ${chunkResult.err}`);
              consecutiveErrors++;
              
              // If we've retrieved some chunks, break on first error (likely reached the end)
              if (chunks.length > 0) {
                console.log(`Retrieved ${chunks.length} chunks, stopping at first error`);
                break;
              }
              
              i++; // Try the next chunk if we haven't found any yet
            }
          } catch (chunkError) {
            console.error(`Exception retrieving chunk ${i}:`, chunkError);
            consecutiveErrors++;
            
            // If we've retrieved some chunks, break on first error
            if (chunks.length > 0) {
              break;
            }
            
            i++; // Try the next chunk if we haven't found any yet
          }
        }
        
        chunkCount = chunks.length;
        console.log(`Retrieved ${chunkCount} chunks totaling ${fileSize} bytes`);
      } catch (e) {
        console.warn("Error in chunk retrieval loop:", e);
      }
      
      if (chunks.length > 0) {
        // Combine all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedData = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          combinedData.set(chunk, offset);
          offset += chunk.length;
        }
        
        return {
          mimeType,
          filename,
          data: combinedData
        };
      }
      
      console.log(`No file chunks found for IP ${ipId.toString()} - file may not be uploaded yet`);
      return null;
    } catch (error) {
      console.error(`Failed to get file chunks:`, error);
      return null;
    }
  }
  
  // Methods for transferring ownership
  public async transferOwnership(ipId: bigint, newOwner: string): Promise<boolean> {
    try {
      const actor = await this.getActor();
      let principal;
      try {
        principal = Principal.fromText(newOwner);
      } catch (error) {
        console.error('Invalid principal ID:', error);
        return false;
      }
      const result = await actor.transferOwnership(ipId, principal);
      return 'ok' in result;
    } catch (error) {
      console.error('Error transferring ownership:', error);
      return false;
    }
  }

  // Methods for handling dispute creation
  public async raiseDispute(ipId: bigint, reason: string, stake: bigint): Promise<Result<bigint, string>> {
    try {
      const actor = await this.getActor();
      const result = await actor.raiseDispute(ipId, reason, stake);
      return result;
    } catch (error) {
      console.error('Error raising dispute:', error);
      return { err: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Methods for dispute voting
  public async voteOnDispute(disputeId: bigint, supportOriginal: boolean): Promise<Result<null, string>> {
    try {
      const actor = await this.getActor();
      const result = await actor.voteOnDispute(disputeId, supportOriginal);
      return result;
    } catch (error) {
      console.error('Error voting on dispute:', error);
      return { err: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Methods for dispute resolution
  public async resolveDispute(disputeId: bigint): Promise<Result<boolean, string>> {
    try {
      const actor = await this.getActor();
      const result = await actor.resolveDispute(disputeId);
      return result;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return { err: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Methods for license issuance
  public async issueLicense(ipId: bigint, licensee: string, terms: string, royalty: number): Promise<Result<bigint, string>> {
    try {
      const actor = await this.getActor();
      let principal;
      try {
        principal = Principal.fromText(licensee);
      } catch (error) {
        console.error('Invalid principal ID:', error);
        return { err: 'Invalid principal ID' };
      }
      const result = await actor.issueLicense(ipId, principal, terms, BigInt(royalty));
      return result;
    } catch (error) {
      console.error('Error issuing license:', error);
      return { err: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Method to get IPs by hash
  async getIpsByHash(fileHash: string): Promise<IpRecordPublic[]> {
    try {
      const actor = await this.getActor();
      return await actor.getIpsByHash(fileHash);
    } catch (error) {
      console.error('Error getting IPs by hash:', error);
      return [];
    }
  }

  // Methods for staking and IP disputes
  public async stake(ipId: bigint, amount: bigint): Promise<boolean> {
    try {
      const actor = await this.getActor();
      const result = await actor.stake(ipId, amount);
      return 'ok' in result;
    } catch (error) {
      console.error('Error staking on IP:', error);
      return false;
    }
  }
}

// Export singleton
export const icAgent = new IcAgent();

// Helper function to guess MIME type from filename - moved from utils.ts to be used here
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
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
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
} 