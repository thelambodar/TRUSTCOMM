/**
 * AURA-TRUST / VERIPROV - Cryptographic Engine
 * Native WebCrypto API wrapper for ECDSA P-256 keypair generation,
 * SHA-256 content hashing, signing, verification, and ZK commitments.
 */

export class CryptoEngine {
  static async generateKeypair() {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
    
    const jwkString = JSON.stringify(publicKeyJwk);
    const keyIdHash = await this.hashText(jwkString);
    const keyId = "KEY-" + keyIdHash.substring(0, 10).toUpperCase();

    return {
      keyId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyJwk,
      privateKeyJwk
    };
  }

  static async hashData(dataBuffer) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
    return this.bufferToHex(hashBuffer);
  }

  static async hashText(text) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);
    return await this.hashData(dataBuffer);
  }

  static async signData(privateKey, messageText) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(messageText);

    const signatureBuffer = await window.crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      privateKey,
      dataBuffer
    );

    return this.bufferToHex(signatureBuffer);
  }

  static async verifySignature(publicKey, signatureHex, messageText) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(messageText);
      const signatureBuffer = this.hexToBuffer(signatureHex);

      return await window.crypto.subtle.verify(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        publicKey,
        signatureBuffer,
        dataBuffer
      );
    } catch (err) {
      return false;
    }
  }

  static async importPublicKey(jwkObj) {
    return await window.crypto.subtle.importKey(
      "jwk",
      jwkObj,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    );
  }

  static async createZkCommitment(fieldValue, salt = null) {
    if (!salt) {
      const saltArray = new Uint8Array(16);
      window.crypto.getRandomValues(saltArray);
      salt = this.bufferToHex(saltArray.buffer);
    }

    const commitmentHash = await this.hashText(`${fieldValue}:${salt}`);
    return { commitmentHash, salt };
  }

  static bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  static hexToBuffer(hexString) {
    const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
  }
}
