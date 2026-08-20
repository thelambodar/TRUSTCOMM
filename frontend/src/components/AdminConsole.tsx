import React, { useState } from 'react';
import {
  Lock,
  Building2,
  Key,
  ShieldAlert,
  Plus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  FileCode,
  Search,
  Eye,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Institution, Credential, VerificationLog } from '../types.js';

interface AdminConsoleProps {
  institutions: Institution[];
  credentials: Credential[];
  verificationLogs: VerificationLog[];
  onRefresh: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  institutions,
  credentials,
  verificationLogs,
  onRefresh,
}) => {
  // Modal & Form States
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstDomain, setNewInstDomain] = useState('');

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedCredToRevoke, setSelectedCredToRevoke] = useState<Credential | null>(null);
  const [revocationReason, setRevocationReason] = useState('');

  const [showIssueCredModal, setShowIssueCredModal] = useState(false);
  const [targetInstId, setTargetInstId] = useState(institutions[0]?.id || '');
  const [keyAlgo, setKeyAlgo] = useState<'RSA-PSS-SHA256' | 'ECDSA-P256-SHA256'>('RSA-PSS-SHA256');

  const [viewingPublicKey, setViewingPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Create Institution (System Admin)
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName || !newInstDomain) {
      setMessage({ type: 'error', text: 'Name and domain are required.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SYSTEM_ADMIN',
        },
        body: JSON.stringify({
          name: newInstName,
          domain: newInstDomain,
          status: 'ACTIVE',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Creation failed' }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }

      setMessage({ type: 'success', text: `Institution '${newInstName}' registered with auto-provisioned KMS credential.` });
      setNewInstName('');
      setNewInstDomain('');
      setShowAddInstModal(false);
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create institution.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Issue Credential (System Admin)
  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInstId) {
      setMessage({ type: 'error', text: 'Please select a target institution.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SYSTEM_ADMIN',
        },
        body: JSON.stringify({
          institutionId: targetInstId,
          keyAlgorithm: keyAlgo,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Issuance failed' }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }

      setMessage({ type: 'success', text: `New ${keyAlgo} cryptographic key pair issued for ${targetInstId}.` });
      setShowIssueCredModal(false);
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to issue credential.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Revoke Credential (System Admin only -> Cloud Function: revokeCredential)
  const handleRevokeCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredToRevoke) return;

    if (!revocationReason.trim()) {
      setMessage({ type: 'error', text: 'A revocation reason is required by security policy.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/credentials/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SYSTEM_ADMIN',
        },
        body: JSON.stringify({
          credentialId: selectedCredToRevoke.id,
          revocationReason: revocationReason.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Revocation failed' }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }

      setMessage({
        type: 'success',
        text: `Credential '${selectedCredToRevoke.id}' revoked. Future media verifications with this key will fail with PROVEN_FAKE.`,
      });
      setShowRevokeModal(false);
      setSelectedCredToRevoke(null);
      setRevocationReason('');
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to revoke credential.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Admin Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">System Admin Control Center</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Institutions & Cryptographic Keystore</h1>
          <p className="text-xs text-slate-400">
            Manage institutional identities, issue cryptographic credentials, and execute emergency revocations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddInstModal(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Institution</span>
          </button>

          <button
            onClick={() => setShowIssueCredModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Issue Key</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start space-x-3 border ${
            message.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <p className="leading-relaxed">{message.text}</p>
        </div>
      )}

      {/* Grid: Institutions & Keystore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institutions Directory */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Registered Issuing Institutions</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{institutions.length} Institutions</span>
          </div>

          <div className="space-y-3">
            {institutions.map((inst) => (
              <div key={inst.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">{inst.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span className="text-cyan-400">{inst.domain}</span>
                    <span>&bull;</span>
                    <span className="text-slate-500">ID: {inst.id}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {inst.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Credentials Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Cryptographic Credentials Keystore</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{credentials.length} Keys</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {credentials.map((cred) => {
              const isRevoked = cred.status === 'REVOKED';
              const inst = institutions.find((i) => i.id === cred.institutionId);

              return (
                <div
                  key={cred.id}
                  className={`p-3.5 rounded-xl border transition space-y-2 ${
                    isRevoked
                      ? 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-white truncate max-w-[180px]">{cred.id}</div>
                      <div className="text-[11px] text-slate-400">{inst?.name || cred.institutionId}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        cred.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {cred.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">{cred.keyAlgorithm}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingPublicKey(cred.publicKey)}
                        className="text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Public Key</span>
                      </button>

                      {cred.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            setSelectedCredToRevoke(cred);
                            setShowRevokeModal(true);
                          }}
                          className="text-rose-400 hover:text-rose-300 font-semibold underline flex items-center space-x-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isRevoked && (
                    <div className="bg-rose-950/40 p-2 rounded text-[10px] text-rose-300 border border-rose-900/40 space-y-0.5">
                      <p className="font-semibold">Revocation Reason:</p>
                      <p>{cred.revocationReason || 'No reason specified'}</p>
                      <p className="text-slate-500">Revoked at: {new Date(cred.revokedAt || '').toLocaleString()}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Verification Audit Logs Live Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Firestore `verificationLogs` Collection Stream</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Total Logs: {verificationLogs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Queried Hash</th>
                <th className="py-2.5 px-3">Issuer / Institution</th>
                <th className="py-2.5 px-3">Tamper / Revocation</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y border-slate-800 text-slate-300">
              {verificationLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                    No verification logs recorded yet.
                  </td>
                </tr>
              ) : (
                verificationLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/40 font-mono text-[11px]">
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.verdict === 'AUTHENTIC'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : log.verdict === 'PROVEN_FAKE'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {log.verdict}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.mediaHash.substring(0, 12)}...{log.mediaHash.substring(log.mediaHash.length - 6)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                      {log.institutionName || log.issuerId || 'Unregistered'}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.tamperDetected ? (
                        <span className="text-rose-400 font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Tamper/Revoked</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Intact</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.checkedAt).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Institution */}
      {showAddInstModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Register New Issuing Institution</h3>
            <form onSubmit={handleCreateInstitution} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  placeholder="e.g. Department of Homeland Security"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Verified Domain</label>
                <input
                  type="text"
                  required
                  value={newInstDomain}
                  onChange={(e) => setNewInstDomain(e.target.value)}
                  placeholder="e.g. dhs.gov"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInstModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  {loading ? 'Registering...' : 'Register Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Credential */}
      {showIssueCredModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Issue Cryptographic Credential</h3>
            <form onSubmit={handleIssueCredential} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Target Institution</label>
                <select
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Key Algorithm</label>
                <select
                  value={keyAlgo}
                  onChange={(e) => setKeyAlgo(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="RSA-PSS-SHA256">RSA-PSS (2048-bit with SHA-256)</option>
                  <option value="ECDSA-P256-SHA256">ECDSA (NIST P-256 with SHA-256)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueCredModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {loading ? 'Generating KMS Keys...' : 'Generate & Issue Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Credential */}
      {showRevokeModal && selectedCredToRevoke && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold">Revoke Institutional Credential</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Revoking credential <span className="font-mono text-rose-400 font-bold">{selectedCredToRevoke.id}</span> will
              immediately mark all signatures issued by this key as <span className="font-bold text-rose-400">PROVEN_FAKE</span> on public verifications.
            </p>

            <form onSubmit={handleRevokeCredential} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Revocation Reason (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  placeholder="e.g. Scheduled key rotation, certificate expiration, suspected private key leakage"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  {loading ? 'Revoking...' : 'Confirm Permanent Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Public Key */}
      {viewingPublicKey && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">SPKI Public Key (PEM Format)</h3>
            <p className="text-xs text-slate-400">
              This public key is distributed for client-side cryptographic verification and signature validity checks.
            </p>
            <pre className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono text-cyan-300 overflow-x-auto border border-slate-800">
              {viewingPublicKey}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setViewingPublicKey(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
