import React, { useState } from 'react';
import {
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  ShieldCheck,
  Building2,
  Clock,
  KeyRound,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { VerificationResultPayload, MediaRecord } from '../types.js';

interface PublicVerificationProps {
  mediaRecords: MediaRecord[];
  onRefresh: () => void;
}

export const PublicVerification: React.FC<PublicVerificationProps> = ({ mediaRecords, onRefresh }) => {
  const [hashInput, setHashInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedClientHash, setCalculatedClientHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute SHA-256 in browser using Web Crypto API
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      try {
        const hash = await calculateFileHash(file);
        setCalculatedClientHash(hash);
        setHashInput(hash);
      } catch (err) {
        console.error('Hash calculation error:', err);
      }
    }
  };

  const handleVerify = async (hashToTest?: string) => {
    const targetHash = (hashToTest || hashInput || calculatedClientHash).trim();
    if (!targetHash && !selectedFile) {
      setError('Please provide a media file or SHA-256 hash to verify.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response: Response;

      if (selectedFile && !hashToTest) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mediaHash', targetHash);
        response = await fetch('/api/media/verify', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/media/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaHash: targetHash }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Verification request failed' }));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data: VerificationResultPayload = await response.json();
      setResult(data);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during media verification.');
    } finally {
      setLoading(false);
    }
  };

  const copyResultJson = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Access Portal &bull; Zero-Trust Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Verify Media Provenance & Cryptographic Signature
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Validate whether official audio, video, broadcast notices, and emergency advisories were authentic and
            unaltered by cross-referencing institutional KMS signatures in Firestore.
          </p>
        </div>
      </div>

      {/* Verification Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: File Upload */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>1. Upload Media File to Verify</span>
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-950/50 rounded-xl p-5 text-center transition cursor-pointer relative">
              <input
                id="file-verify-input"
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-xs text-slate-300 font-medium truncate">
                {selectedFile ? selectedFile.name : 'Drag & drop or browse media file'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Audio (MP3/WAV), Video (MP4), Notice PDF, Emergency</p>
            </div>
            {calculatedClientHash && (
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span className="text-slate-500">SHA-256:</span>
                <span className="text-cyan-400 truncate max-w-[280px]">{calculatedClientHash}</span>
              </div>
            )}
          </div>

          {/* Option B: Direct SHA-256 Hash */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>2. Or Paste SHA-256 Hash</span>
            </label>
            <div className="space-y-2">
              <textarea
                id="input-media-hash"
                rows={3}
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="e.g. 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Standard 64-character hexadecimal SHA-256 string</span>
                {hashInput && (
                  <button
                    onClick={() => {
                      setHashInput('');
                      setSelectedFile(null);
                      setCalculatedClientHash('');
                    }}
                    className="text-slate-400 hover:text-white underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Error */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public endpoint does not require user credentials.</span>
          </div>

          <button
            id="btn-verify-media"
            disabled={loading}
            onClick={() => handleVerify()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/20 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Cryptographic Verification...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Run Cryptographic Verification</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-4 text-rose-300 text-xs flex items-start space-x-3">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Verification Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pre-seeded Test Samples Quick Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Demo Test Scenarios:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {mediaRecords.slice(0, 3).map((rec) => {
            const isFema = rec.id.includes('fema-001');
            const isRevoked = rec.id.includes('revoked');
            const isDraft = rec.status === 'PENDING_SIGNATURE';

            return (
              <button
                key={rec.id}
                onClick={() => {
                  setHashInput(rec.mediaHash);
                  setSelectedFile(null);
                  setCalculatedClientHash(rec.mediaHash);
                  handleVerify(rec.mediaHash);
                }}
                className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                  isFema
                    ? 'bg-emerald-950/30 border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300'
                    : isRevoked
                    ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-900/40 text-rose-300'
                    : 'bg-amber-950/30 border-amber-800/60 hover:bg-amber-900/40 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white truncate max-w-[170px]">{rec.title || rec.id}</span>
                  <span className="text-[10px] font-mono uppercase px-1 py-0.5 rounded bg-slate-900">
                    {isFema ? 'AUTHENTIC' : isRevoked ? 'REVOKED' : 'UNSIGNED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{rec.mediaType} &bull; {rec.originalFileName}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-2 truncate">Hash: {rec.mediaHash.substring(0, 16)}...</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verification Result Output */}
      {result && (
        <div className="space-y-6">
          {/* Main Verdict Card */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 shadow-xl transition relative overflow-hidden ${
              result.verdict === 'AUTHENTIC'
                ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-100'
                : result.verdict === 'PROVEN_FAKE'
                ? 'bg-rose-950/40 border-rose-700/80 text-rose-100'
                : 'bg-amber-950/40 border-amber-700/80 text-amber-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/60">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    result.verdict === 'AUTHENTIC'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : result.verdict === 'PROVEN_FAKE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {result.verdict === 'AUTHENTIC' && <CheckCircle2 className="w-8 h-8" />}
                  {result.verdict === 'PROVEN_FAKE' && <XCircle className="w-8 h-8" />}
                  {result.verdict === 'UNSIGNED' && <AlertTriangle className="w-8 h-8" />}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Verification Result
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-300">
                      Log ID: {result.logId}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                    VERDICT: {result.verdict}
                  </h2>
                </div>
              </div>

              <button
                onClick={copyResultJson}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-700 flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Certificate' : 'Copy JSON Certificate'}</span>
              </button>
            </div>

            {/* Explanation & Details */}
            <div className="py-6 space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-slate-200">{result.details}</p>

              {/* Status Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cryptographic Signature</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">
                    {result.isSigned ? 'Valid KMS Signature' : 'No Signature Found'}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Issuing Institution</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1 truncate">
                    {result.institutionName || result.issuerId || 'Unregistered'}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Credential Trust Status</span>
                  </div>
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      result.credentialStatus === 'ACTIVE'
                        ? 'text-emerald-400'
                        : result.credentialStatus === 'REVOKED'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {result.credentialStatus || 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Checked Timestamp</span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 mt-1">
                    {new Date(result.checkedAt).toLocaleTimeString()} &bull; {new Date(result.checkedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Media Metadata & Storage Path */}
            {result.mediaRecord && (
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Firestore Media Manifest: {result.mediaRecord.title || result.mediaRecord.originalFileName}</span>
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {result.mediaRecord.mediaType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-500">Storage Path:</span>
                    <p className="text-slate-200 truncate">{result.mediaRecord.storagePath}</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-500">Credential ID:</span>
                    <p className="text-slate-200 truncate">{result.mediaRecord.credentialId || 'None'}</p>
                  </div>
                </div>

                {result.mediaRecord.signature && (
                  <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500 block mb-0.5">Base64 KMS Digital Signature:</span>
                    <p className="text-cyan-300/90 break-all">{result.mediaRecord.signature}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
