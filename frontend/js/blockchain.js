/**
 * TRUSTCOMM - Permissioned Blockchain Audit Ledger
 * Hyperledger Fabric / Off-chain audit log simulator for cryptographic events.
 * Media files remain off-chain; only hashes, signer identity, version state, and revocation events are recorded.
 */

import { CryptoEngine } from './crypto.js';

export class BlockchainLedger {
  constructor() {
    this.storageKey = 'trustcomm_blockchain_audit_ledger';
    this.blocks = this.loadLedger();
  }

  loadLedger() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return this.createGenesisBlock();
  }

  createGenesisBlock() {
    return [
      {
        blockIndex: 0,
        timestamp: '2026-08-01T00:00:00.000Z',
        eventType: 'GENESIS_BLOCK',
        noticeId: 'GENESIS-0000',
        version: 'v1.0',
        signerId: 'SYSTEM-ROOT-KEY',
        contentHash: '0000000000000000000000000000000000000000000000000000000000000000',
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        previousBlockHash: '0x00000000000000000000000000000000',
        details: 'TRUSTCOMM Permissioned Ledger Genesis Block Initialized'
      }
    ];
  }

  saveLedger() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.blocks));
  }

  async recordEvent({
    eventType,
    noticeId,
    version = 'v1.0',
    signerId,
    contentHash,
    details = ''
  }) {
    const previousBlock = this.blocks[this.blocks.length - 1];
    const timestamp = new Date().toISOString();
    
    const payload = {
      blockIndex: this.blocks.length,
      timestamp,
      eventType,
      noticeId,
      version,
      signerId,
      contentHash,
      previousBlockHash: previousBlock.txHash,
      details
    };

    const txHash = await CryptoEngine.generateTxHash(payload);
    payload.txHash = txHash;

    this.blocks.unshift(payload); // Newest first for visual audit
    this.saveLedger();
    return payload;
  }

  getBlocks() {
    return this.blocks;
  }

  getBlocksByNoticeId(noticeId) {
    return this.blocks.filter(b => b.noticeId === noticeId);
  }
}
