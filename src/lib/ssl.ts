// /src/lib/ssl.ts
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { bucket } from "@/lib/gcs"; // 👈 Use this — not BUCKET_NAME
import { debugLog } from "@/utils/debug";

export async function generateSSLCertificate(holographId: string): Promise<{ sslCertPath: string; sslKeyPath: string }> {
  const certPath = path.join("/tmp", `${holographId}.crt`);
  const keyPath = path.join("/tmp", `${holographId}.key`);
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
        // ✅ Upload to GCS
        const sslCertDest = `${sslBasePath}/public.crt`;
        const sslKeyDest = `${sslBasePath}/private.key`;

        // GCS doesn't require you to manually create the folder, but you can write a placeholder if needed
        await bucket.file(`${sslBasePath}/.placeholder`).save("");

        await bucket.upload(certPath, { destination: sslCertDest });
        await bucket.upload(keyPath, { destination: sslKeyDest });

        // ✅ Clean up local certs
        fs.unlinkSync(certPath);
        fs.unlinkSync(keyPath);

        debugLog("✅ SSL cert and key uploaded to GCS:", sslBasePath);

        resolve({
          sslCertPath: sslCertDest,
          sslKeyPath: sslKeyDest,
        });
      } catch (uploadError: any) {
        reject(new Error(`❌ Error uploading to GCS: ${uploadError.message}`));
      }
    });
  });
}
