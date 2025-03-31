//  /src/utils/encryption.ts

import crypto from "crypto";
import { storage } from "@/lib/gcs"; // Your GCS client for Google Cloud Storage
import { debugLog } from "./debug"; // Optional: for logging

const BUCKET_NAME = process.env.GCS_BUCKET_NAME!;

/**
 * Key storage structure:
 * ssl-keys/<holographId>/current/public.crt - Public key for encryption
 * ssl-keys/<holographId>/current/private.key - Private key for decryption
 * 
 * This structure provides improved security through:
 * - Isolation of keys by holograph
 * - Clear separation of public and private keys
 * - Foundation for future versioning and rotation
 */

/**
 * Encrypts a field using AES + RSA (Hybrid Encryption).
 * @param holographId ID of the Holograph (used to fetch SSL public key)
 * @param plainText The text you want to encrypt (e.g., document name or notes)
 * @returns { encryptedValue, encryptedKey, iv } - All base64 encoded strings
 */
export async function encryptFieldWithHybridEncryption(
  holographId: string,
  plainText: string
) {
  try {
    // 1. Generate AES key and IV
    const aesKey = crypto.randomBytes(32); // 256-bit AES key
    const iv = crypto.randomBytes(16);     // 128-bit IV

    // 2. Encrypt plainText using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    let encrypted = cipher.update(plainText, "utf8", "base64");
    encrypted += cipher.final("base64");

    // 3. Download SSL public key from GCS
    const certPath = `ssl-keys/${holographId}/current/public.crt`; // Public cert stored in GCS under ssl/{holographId}/
    const [certFile] = await storage.bucket(BUCKET_NAME).file(certPath).download();
    const publicKey = certFile.toString("utf-8");
    debugLog("✅ SSL certificate downloaded");

    // 4. Encrypt AES key using public SSL key
    const encryptedKeyBuffer = crypto.publicEncrypt(publicKey, aesKey);
    const encryptedKeyBase64 = encryptedKeyBuffer.toString("base64");

    debugLog("✅ AES key encrypted with SSL cert");

    // Return all components for storage in database
    return {
      encryptedValue: encrypted, // Base64 string
      encryptedKey: encryptedKeyBase64, // Base64 string
      iv: iv.toString("base64"), // Base64 string
    };
  } catch (error) {
      console.error(
        `❌ Error during encryption. Failed to access key at ssl-keys/${holographId}/current/public.crt:`,
        error
      );
    throw error;
  }
}

/**
 * Decrypts a field using AES + RSA (Hybrid Decryption).
 * @param holographId ID of the Holograph (used to fetch private key)
 * @param encryptedValue Base64 encrypted data
 * @param encryptedKey Base64 encrypted AES key
 * @param iv Base64 IV used during encryption
 * @returns { decryptedValue } - Decrypted text (string)
 */
export async function decryptFieldWithHybridEncryption(
    holographId: string,
    encryptedValue: string,
    encryptedKey: string,
    iv: string
  ) {
    try {
      // 1. Download SSL private key from GCS
      const keyPath = `ssl-keys/${holographId}/current/private.key`;
      const [keyFile] = await storage.bucket(BUCKET_NAME).file(keyPath).download();
      const privateKey = keyFile.toString("utf-8");
      debugLog("✅ SSL private key downloaded");
  
      // 2. Decrypt AES key using private key
      const encryptedKeyBuffer = Buffer.from(encryptedKey, "base64");
      const aesKey = crypto.privateDecrypt(privateKey, encryptedKeyBuffer);
      debugLog("✅ AES key decrypted");
  
      // 3. Decrypt value using AES key + IV
      const ivBuffer = Buffer.from(iv, "base64");
      const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, ivBuffer);
      let decrypted = decipher.update(encryptedValue, "base64", "utf8");
      decrypted += decipher.final("utf8");
      debugLog("✅ Field decrypted successfully");
  
      return decrypted;
    } catch (error) {
        console.error(
          `❌ Error during decryption. Failed to access key at ssl-keys/${holographId}/current/private.key:`,
          error
        );
      return null; // Return null if decryption fails
    }
  }
