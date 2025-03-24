export const idlFactory = ({ IDL }) => {
  const IpID = IDL.Nat;
  const DisputeID = IDL.Nat;
  const IPStatus = IDL.Variant({
    'Unverified' : IDL.Null,
    'Verified' : IDL.Null,
    'UnderDispute' : IDL.Null,
    'Revoked' : IDL.Null,
  });
  const License = IDL.Record({
    'id' : IDL.Nat,
    'licensee' : IDL.Principal,
    'terms' : IDL.Text,
    'royalty' : IDL.Nat,
    'valid' : IDL.Bool,
    'createdAt' : IDL.Int,
  });
  const IpRecordPublic = IDL.Record({
    'id' : IpID,
    'owner' : IDL.Principal,
    'title' : IDL.Text,
    'description' : IDL.Text,
    'file_hash' : IDL.Text,
    'status' : IPStatus,
    'stakes' : IDL.Nat,
    'licenses' : IDL.Vec(License),
    'disputes' : IDL.Vec(DisputeID),
    'created' : IDL.Int,
    'updated' : IDL.Int,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : DisputeID, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const EventKind = IDL.Variant({
    'IpCreated' : IpID,
    'IpStaked' : IDL.Tuple(IpID, IDL.Principal, IDL.Nat),
    'DisputeRaised' : DisputeID,
    'DisputeVote' : IDL.Tuple(DisputeID, IDL.Principal, IDL.Bool),
    'DisputeResolved' : IDL.Tuple(DisputeID, IDL.Bool),
    'LicenseIssued' : IDL.Tuple(IpID, IDL.Principal),
    'OwnershipTransferred' : IDL.Tuple(IpID, IDL.Principal, IDL.Principal),
  });
  const Event = IDL.Record({
    'kind' : EventKind,
    'timestamp' : IDL.Int,
  });
  const FileInfo = IDL.Record({
    'chunkCount' : IDL.Nat,
    'fileSize' : IDL.Nat,
    'mimeType' : IDL.Text,
    'filename' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : FileInfo, 'err' : IDL.Text });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });

  return IDL.Service({
    'createIpRecord' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IpID],
        [],
      ),
    'finishUpload' : IDL.Func([IpID, IDL.Nat], [Result], []),
    'getEvents' : IDL.Func([], [IDL.Vec(Event)], ['query']),
    'getFileChunk' : IDL.Func([IpID, IDL.Nat], [Result_5], ['query']),
    'getFileInfo' : IDL.Func([IpID], [Result_4], ['query']),
    'getIp' : IDL.Func([IpID], [IDL.Opt(IpRecordPublic)], ['query']),
    'issueLicense' : IDL.Func(
        [IpID, IDL.Principal, IDL.Text, IDL.Nat],
        [Result_3],
        [],
      ),
    'listAllIPs' : IDL.Func([], [IDL.Vec(IpRecordPublic)], ['query']),
    'raiseDispute' : IDL.Func([IpID, IDL.Text, IDL.Nat], [Result_1], []),
    'resolveDispute' : IDL.Func([DisputeID], [Result_2], []),
    'stake' : IDL.Func([IpID, IDL.Nat], [Result], []),
    'transferOwnership' : IDL.Func([IpID, IDL.Principal], [Result], []),
    'updateTokenCanisterId' : IDL.Func([IDL.Text], [], []),
    'uploadChunk' : IDL.Func([IpID, IDL.Nat, IDL.Vec(IDL.Nat8)], [Result], []),
    'voteOnDispute' : IDL.Func([DisputeID, IDL.Bool], [Result], []),
  });
}; 