// /src/lib/ssl.ts
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { bucket } from "@/lib/gcs"; // 👈 Use this — not BUCKET_NAME
import { debugLog } from "@/utils/debug";
import crypto from "crypto";

export async function generateSSLCertificate(holographId: string): Promise<{ sslCertPath: string; sslKeyPath: string; aesKeyPath: string }> {
  const certPath = path.join("/tmp", `${holographId}.crt`);
  const keyPath = path.join("/tmp", `${holographId}.key`);
  const aesKeyPath = path.join("/tmp", `${holographId}.aes`); // 🔐 New line for AES key
  const sslBasePath = `ssl-keys/${holographId}/current`;

  const args = [
    "req", "-x509", "-nodes",
    "-newkey", "rsa:2048",
    "-keyout", keyPath,
    "-out", certPath,
    "-days", "365",
    "-subj", `/CN=${holographId}`
  ];

  return new Promise((resolve, reject) => {
    const openssl = spawn("openssl", args);

    openssl.stderr.on("data", (data) => {
      console.error("OpenSSL error:", data.toString());
    });

    openssl.on("close", async (code) => {
      if (code !== 0) {
        return reject(new Error(`OpenSSL exited with code ${code}`));
      }

      try {

        // ✅ Upload placeholder to GCS folder
        await bucket.file(`${sslBasePath}/.placeholder`).save("");

        // ✅ Upload cert + RSA key
        await bucket.upload(certPath, { destination: `${sslBasePath}/public.crt` });
        await bucket.upload(keyPath, { destination: `${sslBasePath}/private.key` });

        // ✅ Generate and upload 32-byte AES key
        const aesKey = crypto.randomBytes(32);
        fs.writeFileSync(aesKeyPath, aesKey);
        await bucket.upload(aesKeyPath, { destination: `${sslBasePath}/aes.key` });

        // ✅ Cleanup
        fs.unlinkSync(certPath);
        fs.unlinkSync(keyPath);
        fs.unlinkSync(aesKeyPath);

        debugLog("✅ SSL + AES keys uploaded to GCS:", sslBasePath);

        resolve({
          sslCertPath: `${sslBasePath}/public.crt`,
          sslKeyPath: `${sslBasePath}/private.key`,
          aesKeyPath: `${sslBasePath}/aes.key`,
        });
      } catch (uploadError: any) {
        reject(new Error(`❌ Error uploading keys to GCS: ${uploadError.message}`));
      }
    });
  });
}
