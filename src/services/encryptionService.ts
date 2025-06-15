import { ethers } from 'ethers';

/**
 * Encryption Service for secure data storage
 * Uses Web Crypto API with AES-GCM encryption
 */
export class EncryptionService {
  // Storage key for the encryption key in localStorage
  private static readonly KEY_STORAGE_KEY = 'encryption_key';
  // AES-GCM recommended IV length (12 bytes)
  private static readonly IV_LENGTH = 12;

  /**
   * Gets existing encryption key or generates a new one
   * @returns Promise<CryptoKey> The encryption key
   */
  private static async getOrCreateKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(this.KEY_STORAGE_KEY);
    if (storedKey) {
      const keyData = ethers.utils.arrayify(storedKey);
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
    }

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const keyString = ethers.utils.hexlify(new Uint8Array(exportedKey));
    localStorage.setItem(this.KEY_STORAGE_KEY, keyString);

    return key;
  }

  /**
   * Generates a random Initialization Vector (IV)
   * @returns Uint8Array Random IV
   */
  private static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  }

  /**
   * Encrypts data using AES-GCM
   * @param data String to encrypt
   * @returns Promise<string> Encrypted data as hex string
   */
  static async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey();
      const iv = this.generateIV();
      const encodedData = new TextEncoder().encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return ethers.utils.hexlify(combined);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data using AES-GCM
   * @param encryptedData Hex string of encrypted data
   * @returns Promise<string> Decrypted data
   */
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey();
      const combined = ethers.utils.arrayify(encryptedData);

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const data = combined.slice(this.IV_LENGTH);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Clears the encryption key from storage
   */
  static clearKey(): void {
    localStorage.removeItem(this.KEY_STORAGE_KEY);
  }
} 