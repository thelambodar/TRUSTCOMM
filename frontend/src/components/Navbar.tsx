import React from 'react';
import { ShieldCheck, Building2, Lock, Cpu, Search, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { UserRole, Institution } from '../types.js';

interface NavbarProps {
  currentTab: 'verify' | 'issuer' | 'admin' | 'architecture';
  setTab: (tab: 'verify' | 'issuer' | 'admin' | 'architecture') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  institutions: Institution[];
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setTab,
  userRole,
  setUserRole,
  institutions,
  selectedInstitutionId,
  setSelectedInstitutionId,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setTab('verify')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-white">Media Authenticity</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  KMS Verifier
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional Cryptographic Provenance Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-tab-verify"
              onClick={() => setTab('verify')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                currentTab === 'verify'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Public Verification</span>
            </button>

            <button
              id="nav-tab-issuer"
              onClick={() => setTab('issuer')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                currentTab === 'issuer'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Institutional Issuer</span>
            </button>

            <button
              id="nav-tab-admin"
              onClick={() => setTab('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                currentTab === 'admin'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>System Admin</span>
            </button>

            <button
              id="nav-tab-architecture"
              onClick={() => setTab('architecture')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                currentTab === 'architecture'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Functions & Architecture</span>
            </button>
          </nav>

          {/* Active Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400 font-mono">Role:</span>
              <select
                id="select-user-role"
                value={userRole}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  setUserRole(r);
                  if (r === 'INSTITUTIONAL_ISSUER' && currentTab === 'verify') {
                    setTab('issuer');
                  } else if (r === 'SYSTEM_ADMIN' && currentTab === 'verify') {
                    setTab('admin');
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              >
                <option value="PUBLIC_RECIPIENT">Public Recipient</option>
                <option value="INSTITUTIONAL_ISSUER">Institutional Issuer</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
              </select>

              {userRole === 'INSTITUTIONAL_ISSUER' && institutions.length > 0 && (
                <select
                  id="select-active-institution"
                  value={selectedInstitutionId}
                  onChange={(e) => setSelectedInstitutionId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-indigo-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[150px] truncate"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name.split('(')[0] || inst.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
