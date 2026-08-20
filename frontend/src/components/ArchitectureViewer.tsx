import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Server,
  Layers,
  Database,
  HardDrive,
  Code2,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Sparkles,
  GitBranch,
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'functions' | 'security' | 'modular'>('functions');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Backend Architecture & Cloud Functions</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Firebase Cloud Functions & Zero-Trust Security Specification</h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Modular, auditable architecture running TypeScript Cloud Functions, Firestore ABAC security rules, and KMS signing abstractions.
        </p>

        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={() => setActiveSubTab('functions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeSubTab === 'functions'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Cloud Functions (4)
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeSubTab === 'security'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Firestore & Storage Rules
          </button>
          <button
            onClick={() => setActiveSubTab('modular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeSubTab === 'modular'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Modular Future Plugs (KMS / AI / Blockchain)
          </button>
        </div>
      </div>

      {/* Subtab 1: Cloud Functions */}
      {activeSubTab === 'functions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Function 1: uploadMedia */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white font-mono flex items-center space-x-1.5">
                <span className="text-cyan-400">fn:</span>
                <span>uploadMedia</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                INSTITUTIONAL_ISSUER
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Handles multipart audio, video, and notice uploads. Authenticates user institution membership, computes binary SHA-256 hash, stores in Cloud Storage (<code className="text-cyan-400">media/institutions/&#123;institutionId&#125;/</code>), and writes manifest to <code className="text-indigo-400">mediaRecords</code>.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <p className="text-cyan-400 font-semibold">// Execution Pipeline:</p>
              <p>1. assertInstitutionalAccess(auth, institutionId)</p>
              <p>2. validateFileType(mediaType, mimeType)</p>
              <p>3. hash = calculateSHA256(fileBuffer)</p>
              <p>4. uploadToStorage(media/institutions/&#123;id&#125;/&#123;filename&#125;)</p>
              <p>5. db.createMediaRecord(&#123; status: 'PENDING_SIGNATURE' &#125;)</p>
            </div>
          </div>

          {/* Function 2: signMedia */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white font-mono flex items-center space-x-1.5">
                <span className="text-cyan-400">fn:</span>
                <span>signMedia</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                INSTITUTIONAL_ISSUER
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Signs media SHA-256 hash using the institution's ACTIVE credential via KMS cryptographic abstraction. Updates <code className="text-indigo-400">mediaRecords.status = 'SIGNED'</code> and returns receipt.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <p className="text-cyan-400 font-semibold">// Execution Pipeline:</p>
              <p>1. assertRole(['INSTITUTIONAL_ISSUER'])</p>
              <p>2. assertCredentialActive(credential.status === 'ACTIVE')</p>
              <p>3. signature = kmsProvider.signHash(credId, hashHex)</p>
              <p>4. db.updateMediaRecord(&#123; signature, status: 'SIGNED' &#125;)</p>
              <p>5. return &#123; signature, mediaHash, status, timestamp &#125;</p>
            </div>
          </div>

          {/* Function 3: verifyMedia */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white font-mono flex items-center space-x-1.5">
                <span className="text-cyan-400">fn:</span>
                <span>verifyMedia</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                PUBLIC_RECIPIENT (No Auth Req)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Public zero-trust verification pipeline. Queries <code className="text-indigo-400">mediaRecords</code> by hash, checks signature against issuer public key, checks credential active/revoked status, returns verdict (<code className="text-emerald-400">AUTHENTIC</code>, <code className="text-amber-400">UNSIGNED</code>, <code className="text-rose-400">PROVEN_FAKE</code>), and logs to <code className="text-cyan-400">verificationLogs</code>.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <p className="text-cyan-400 font-semibold">// Execution Pipeline:</p>
              <p>1. record = findMediaRecordByHash(mediaHash)</p>
              <p>2. if (!record || !record.signature) return UNSIGNED</p>
              <p>3. if (cred.status === 'REVOKED') return PROVEN_FAKE</p>
              <p>4. if (!verifySignature(pubKey, hash, sig)) return PROVEN_FAKE</p>
              <p>5. createVerificationLog(&#123; verdict: 'AUTHENTIC' &#125;)</p>
            </div>
          </div>

          {/* Function 4: revokeCredential */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white font-mono flex items-center space-x-1.5">
                <span className="text-cyan-400">fn:</span>
                <span>revokeCredential</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-rose-400 border border-slate-800">
                SYSTEM_ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Admin-restricted security tool. Sets credential status to <code className="text-rose-400">REVOKED</code>, records <code className="text-slate-400">revokedAt</code> timestamp and reason, instantly disqualifying all future verifications relying on this key.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <p className="text-cyan-400 font-semibold">// Execution Pipeline:</p>
              <p>1. AuthService.assertSystemAdmin(auth)</p>
              <p>2. validate(credentialId, revocationReason)</p>
              <p>3. updateCredential(&#123; status: 'REVOKED', revokedAt, reason &#125;)</p>
              <p>4. return updatedCredential</p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Security Rules */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Firestore Security Rules Summary (`firestore.rules`)</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Zero-Trust ABAC</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">/institutions/&#123;id&#125;</span>
                <p className="text-slate-300">allow read: if true; (Public directory)</p>
                <p className="text-rose-400">allow write: if false; (Cloud Functions / Admin SDK only)</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">/credentials/&#123;id&#125;</span>
                <p className="text-slate-300">allow read: if true; (Public key discovery)</p>
                <p className="text-rose-400">allow write: if false; (Cloud Functions / KMS only)</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">/mediaRecords/&#123;id&#125;</span>
                <p className="text-slate-300">allow get, list: if true; (Hash lookup)</p>
                <p className="text-rose-400">allow write: if false; (Upload/Sign Cloud Functions only)</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">/verificationLogs/&#123;id&#125;</span>
                <p className="text-slate-300">allow read: if isSystemAdmin();</p>
                <p className="text-rose-400">allow write: if false; (verifyMedia fn only)</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <HardDrive className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Firebase Storage Rules (`storage.rules`)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Files are isolated under <code className="text-cyan-400">media/institutions/&#123;institutionId&#125;/</code>. Only authorized issuers belonging to that institution or system admins can write, with file size capped at 100MB and strict MIME checks.
            </p>
          </div>
        </div>
      )}

      {/* Subtab 3: Modular Future Plugs */}
      {activeSubTab === 'modular' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">1. Google Cloud KMS</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Implemented with the <code className="text-cyan-400">IKMSProvider</code> interface. Currently backed by Node.js crypto hardware enclave emulation; seamlessly swaps to GCP KMS asymmetric signing in production.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400">
              ✓ Plug status: Active & Abstracted
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">2. PyTorch Cloud Run Service</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Defined via <code className="text-indigo-400">IDeepfakeDetectorProvider</code>. Returns synthetic manipulation probabilities and confidence intervals for audio/video frames without altering core verification rules.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-indigo-300">
              ✓ Hook ready for Cloud Run endpoint
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <GitBranch className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">3. Blockchain Provenance</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Defined via <code className="text-emerald-400">IBlockchainProvenanceProvider</code>. Allows anchoring SHA-256 media hashes and issuer IDs on Ethereum/Polygon L2 smart contracts for immutable public timestamping.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400">
              ✓ Hook ready for smart contract RPC
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
