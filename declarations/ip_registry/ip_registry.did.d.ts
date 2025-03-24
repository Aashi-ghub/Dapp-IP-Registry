import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface DisputeID extends bigint {}
export interface Event {
  'kind' : EventKind,
  'timestamp' : bigint,
}
export type EventKind = { 'IpCreated' : IpID } |
  { 'IpStaked' : [IpID, Principal, bigint] } |
  { 'DisputeRaised' : DisputeID } |
  { 'DisputeVote' : [DisputeID, Principal, boolean] } |
  { 'DisputeResolved' : [DisputeID, boolean] } |
  { 'LicenseIssued' : [IpID, Principal] } |
  { 'OwnershipTransferred' : [IpID, Principal, Principal] };
export interface FileInfo {
  'chunkCount' : bigint,
  'fileSize' : bigint,
  'mimeType' : string,
  'filename' : string,
}
export interface IPStatus {
  'Unverified' : null,
  'Verified' : null,
  'UnderDispute' : null,
  'Revoked' : null,
}
export interface IpID extends bigint {}
export interface IpRecordPublic {
  'id' : IpID,
  'owner' : Principal,
  'title' : string,
  'description' : string,
  'file_hash' : string,
  'status' : IPStatus,
  'stakes' : bigint,
  'licenses' : Array<License>,
  'disputes' : Array<DisputeID>,
  'created' : bigint,
  'updated' : bigint,
}
export interface License {
  'id' : bigint,
  'licensee' : Principal,
  'terms' : string,
  'royalty' : bigint,
  'valid' : boolean,
  'createdAt' : bigint,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : DisputeID } |
  { 'err' : string };
export type Result_2 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_4 = { 'ok' : FileInfo } |
  { 'err' : string };
export type Result_5 = { 'ok' : Uint8Array } |
  { 'err' : string };

export interface _SERVICE {
  'createIpRecord' : ActorMethod<[string, string, string], IpID>,
  'finishUpload' : ActorMethod<[IpID, bigint], Result>,
  'getEvents' : ActorMethod<[], Array<Event>>,
  'getFileChunk' : ActorMethod<[IpID, bigint], Result_5>,
  'getFileInfo' : ActorMethod<[IpID], Result_4>,
  'getIp' : ActorMethod<[IpID], [] | [IpRecordPublic]>,
  'issueLicense' : ActorMethod<[IpID, Principal, string, bigint], Result_3>,
  'listAllIPs' : ActorMethod<[], Array<IpRecordPublic>>,
  'raiseDispute' : ActorMethod<[IpID, string, bigint], Result_1>,
  'resolveDispute' : ActorMethod<[DisputeID], Result_2>,
  'stake' : ActorMethod<[IpID, bigint], Result>,
  'transferOwnership' : ActorMethod<[IpID, Principal], Result>,
  'updateTokenCanisterId' : ActorMethod<[string], undefined>,
  'uploadChunk' : ActorMethod<[IpID, bigint, Uint8Array | number[]], Result>,
  'voteOnDispute' : ActorMethod<[DisputeID, boolean], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory; 