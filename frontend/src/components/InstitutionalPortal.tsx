import React, { useState } from 'react';
import {
  Upload,
  FileCheck,
  Building2,
  Key,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  HardDrive,
  Cpu,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Institution, Credential, MediaRecord, MediaType } from '../types.js';

interface InstitutionalPortalProps {
  institutions: Institution[];
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
  credentials: Credential[];
  mediaRecords: MediaRecord[];
  onRefresh: () => void;
}

export const InstitutionalPortal: React.FC<InstitutionalPortalProps> = ({
  institutions,
  selectedInstitutionId,
  setSelectedInstitutionId,
  credentials,
  mediaRecords,
  onRefresh,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('NOTICE');
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [signingRecordId, setSigningRecordId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter records and credentials for current institution
  const instCredentials = credentials.filter((c) => c.institutionId === selectedInstitutionId);
  const activeCredentials = instCredentials.filter((c) => c.status === 'ACTIVE');
  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId);
  const instRecords = mediaRecords.filter((m) => m.institutionId === selectedInstitutionId);

  // Default select first active credential if not explicitly chosen
  const activeCredId = selectedCredentialId || (activeCredentials.length > 0 ? activeCredentials[0].id : '');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a media file to upload.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('institutionId', selectedInstitutionId);
      formData.append('mediaType', mediaType);
      formData.append('title', title || file.name);
      if (activeCredId) {
        formData.append('credentialId', activeCredId);
      }

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'x-user-role': 'INSTITUTIONAL_ISSUER',
          'x-institution-id': selectedInstitutionId,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({
        type: 'success',
        text: `Media uploaded successfully! SHA-256 Hash: ${data.mediaHash.substring(0, 16)}...`,
      });
      setFile(null);
      setTitle('');
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error uploading media.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSign = async (mediaRecordId: string) => {
    if (!activeCredId) {
      setMessage({
        type: 'error',
        text: 'No active signing credential available. Admin must issue an ACTIVE credential for this institution.',
      });
      return;
    }

    setSigningRecordId(mediaRecordId);
    setMessage(null);

    try {
      const res = await fetch('/api/media/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'INSTITUTIONAL_ISSUER',
          'x-institution-id': selectedInstitutionId,
        },
        body: JSON.stringify({
          mediaRecordId,
          credentialId: activeCredId,
          institutionId: selectedInstitutionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signing failed');
      }

      setMessage({
        type: 'success',
        text: `Media successfully signed with KMS key algorithm '${data.keyAlgorithm}'!`,
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error signing media record.' });
    } finally {
      setSigningRecordId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Official Institutional Issuance Studio</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ABAC Enforced
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                Upload official advisories & cryptographically bind digital provenance manifests using HSM KMS credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs text-slate-400 font-mono">Institution:</label>
            <select
              id="portal-select-institution"
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Portal State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center space-x-3 ${
            message.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid: Media Upload Form & Active KMS Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
            <Upload className="w-5 h-5 text-cyan-400" />
            <span>1. Upload Media for Provenance Indexing</span>
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document / Notice Title</label>
              <input
                id="input-media-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Official Hurricane Evacuation Advisory - Sector 4"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Media Category</label>
                <select
                  id="input-media-type"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as MediaType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="NOTICE">Notice / Official Document</option>
                  <option value="EMERGENCY">Emergency Broadcast</option>
                  <option value="AUDIO">Audio Advisory</option>
                  <option value="VIDEO">Video Broadcast</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Signing KMS Credential</label>
                <select
                  id="input-signing-credential"
                  value={activeCredId}
                  onChange={(e) => setSelectedCredentialId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {activeCredentials.length === 0 ? (
                    <option value="">No Active Credentials Found</option>
                  ) : (
                    activeCredentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.id} ({cred.keyAlgorithm})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select File</label>
              <div className="border-2 border-dashed border-slate-800 hover:border-cyan-700/60 rounded-xl p-6 text-center bg-slate-950/50 transition">
                <input
                  id="input-media-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="input-media-file" className="cursor-pointer flex flex-col items-center space-y-2">
                  <FileText className="w-8 h-8 text-cyan-500/70" />
                  <span className="text-sm font-medium text-slate-300">
                    {file ? file.name : 'Click to select file or drag & drop'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, MP4, MP3, WAV, JSON up to 100MB'}
                  </span>
                </label>
              </div>
            </div>

            <button
              id="btn-upload-media"
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading & Calculating SHA-256...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Register Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Institution KMS Credential Status Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
              <Key className="w-5 h-5 text-indigo-400" />
              <span>Active Signing Key Vault</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 block font-mono">Institution Authority:</span>
                <span className="font-semibold text-slate-200">{currentInstitution?.name || selectedInstitutionId}</span>
                <span className="text-slate-500 block font-mono text-[11px]">Domain: {currentInstitution?.domain}</span>
              </div>

              {instCredentials.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>No credentials issued yet for this institution.</span>
                </div>
              ) : (
                instCredentials.map((cred) => (
                  <div
                    key={cred.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      cred.status === 'ACTIVE'
                        ? 'bg-indigo-950/40 border-indigo-800/60 text-slate-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="truncate font-semibold">{cred.id}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          cred.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {cred.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] font-mono">Algorithm: {cred.keyAlgorithm}</div>
                    {cred.status === 'REVOKED' && (
                      <div className="text-rose-400 text-[10px]">Reason: {cred.revocationReason}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>KMS hardware security module active. Private keys isolated in backend enclave.</span>
          </div>
        </div>
      </div>

      {/* Institutional Media Library */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <span>Registered Institutional Media Records ({instRecords.length})</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Off-chain storage + Cryptographic Manifests</span>
        </div>

        {instRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No media records registered for this institution yet. Upload a file above to generate a media digest.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title / File</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">SHA-256 Digest</th>
                  <th className="py-3 px-4">Signature Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {instRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{record.title || record.originalFileName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{record.originalFileName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {record.mediaType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 max-w-[180px] truncate" title={record.mediaHash}>
                      {record.mediaHash.substring(0, 16)}...
                    </td>
                    <td className="py-3 px-4">
                      {record.status === 'SIGNED' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SIGNED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950 text-amber-400 border border-amber-800 flex items-center space-x-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>PENDING SIGNATURE</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      {record.status !== 'SIGNED' && (
                        <button
                          onClick={() => handleSign(record.id)}
                          disabled={signingRecordId === record.id}
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition text-[11px] shadow inline-flex items-center space-x-1 disabled:opacity-50"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>Sign Media</span>
                        </button>
                      )}
                      <a
                        href={`/api/storage/${record.storagePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] inline-flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>File</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
