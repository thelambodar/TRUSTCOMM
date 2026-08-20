/**
 * Modular Provider interfaces for future Deepfake AI and Blockchain extensions.
 */

export interface DeepfakeAnalysisResult {
  deepfakeScore: number; // 0.0 (authentic) to 1.0 (synthetically generated / fake)
  manipulationDetected: boolean;
  confidence: number;
  modelDetails?: string;
}

/**
 * Interface for connecting to a Python/PyTorch Cloud Run microservice.
 */
export interface IDeepfakeDetectorProvider {
  analyzeMedia(storagePath: string, mediaType: string): Promise<DeepfakeAnalysisResult>;
}

/**
 * Default stub/mock-ready provider until Python PyTorch service is deployed.
 */
export class CloudRunDeepfakeDetectorStub implements IDeepfakeDetectorProvider {
  async analyzeMedia(_storagePath: string, _mediaType: string): Promise<DeepfakeAnalysisResult> {
    // Modular placeholder: ready to execute HTTP call to Cloud Run Python PyTorch inference endpoint
    return {
      deepfakeScore: 0.02,
      manipulationDetected: false,
      confidence: 0.98,
      modelDetails: 'PyTorch-XceptionNet-CloudRun (Modular Hook Ready)',
    };
  }
}

export interface BlockchainAnchorResult {
  txHash: string;
  blockNumber?: number;
  network: string;
  anchoredAt: string;
}

/**
 * Interface for future Blockchain Provenance anchoring.
 */
export interface IBlockchainProvenanceProvider {
  anchorMediaHash(mediaHash: string, institutionId: string): Promise<BlockchainAnchorResult>;
  verifyAnchor(mediaHash: string, txHash: string): Promise<boolean>;
}

/**
 * Default stub/mock-ready provider until blockchain contract integration.
 */
export class BlockchainProvenanceStub implements IBlockchainProvenanceProvider {
  async anchorMediaHash(mediaHash: string, _institutionId: string): Promise<BlockchainAnchorResult> {
    return {
      txHash: `0x${mediaHash.substring(0, 40)}`,
      blockNumber: 18459201,
      network: 'Ethereum/Polygon L2 Provenance (Modular Hook Ready)',
      anchoredAt: new Date().toISOString(),
    };
  }

  async verifyAnchor(_mediaHash: string, _txHash: string): Promise<boolean> {
    return true;
  }
}

export const deepfakeDetector = new CloudRunDeepfakeDetectorStub();
export const blockchainProvider = new BlockchainProvenanceStub();
