// /src/lib/gcs.ts

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import { Readable } from 'stream';
import { debugLog } from "../utils/debug";


// ✅ Ensure environment variables are correctly set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS is missing.');
} else if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('❌ Service account key file does not exist at:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  debugLog('🟢 Found service account key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

if (!process.env.GOOGLE_CLOUD_PROJECT) {
  console.error('❌ GOOGLE_CLOUD_PROJECT is missing.');
} else {
  debugLog('🟢 Google Cloud Project:', process.env.GOOGLE_CLOUD_PROJECT);
}

if (!process.env.GCS_BUCKET_NAME) {
  console.error('❌ GCS_BUCKET_NAME is missing.');
} else {
  debugLog('🟢 Using Google Cloud Storage Bucket:', process.env.GCS_BUCKET_NAME);
}

// ✅ Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

export { storage };


// ✅ Select the bucket
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME as string);

/**
 * Deletes a file from Google Cloud Storage.
 * @param {string} filePath - The path of the file in GCS.
 * @returns {Promise<void>}
 */
export async function deleteFileFromGCS(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      console.error('❌ No file path provided for deletion.');
      return reject('No file path provided');
    }

    try {
      debugLog('🔄 Original filePath from database:', filePath);

      // ✅ Ensure we are only using the relative object path
      let gcsFilePath = filePath.trim(); // Ensure no extra spaces

      debugLog('🟢 Corrected GCS file path for deletion:', gcsFilePath);
      const file = bucket.file(gcsFilePath);

      file.delete()
        .then(() => {
          debugLog('✅ File successfully deleted from GCS:', gcsFilePath);
          resolve();
        })
        .catch((error) => {
          console.error('❌ Error deleting file from GCS:', error);
          reject(error);
        });
    } catch (error) {
      console.error('❌ Failed to extract valid file path:', filePath, error);
      reject('Invalid file path format');
    }
  });
}
  
export async function uploadFileToGCS(file: any, gcsFileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      console.error('❌ No file provided for upload.');
      return reject('No file provided');
    }
    
    debugLog("Received file:", file);
    debugLog('🟢 Starting file upload:', gcsFileName);
    const fileUpload = bucket.file(gcsFileName);

    let readStream;

    // If the file has a stream method, it's a Web File (from a browser FormData)
    if (typeof file.stream === 'function') {
      // Convert the Web ReadableStream to a Node.js Readable stream
      readStream = Readable.fromWeb(file.stream());
    } else if (file.filepath) {
      // Fallback for a server-side file with a filepath property
      readStream = fs.createReadStream(file.filepath);
    } else {
      console.error("❌ File does not have a readable stream or filepath");
      return reject("File does not have a readable stream or filepath");
    }

    readStream
      .pipe(
        fileUpload.createWriteStream({
          resumable: false,
          public: false,
          metadata: { contentType: file.type },
        })
      )
      .on('error', (err) => {
        console.error('❌ GCS Upload Error:', err);
        reject(err);
      })
      .on('finish', async () => {
        debugLog('✅ File successfully uploaded to GCS:', gcsFileName);
        // Construct the full public URL for the uploaded file.
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsFileName}`;
        resolve(publicUrl);
      });
  });
}


/**
 * Uploads a file buffer (from req.formData()) to GCS
 * @param {Buffer} buffer - The file buffer
 * @param {string} gcsFileName - Target GCS path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} Public URL
 * THIS MAY REPLACE THE UPLOADFILETOGCS FUNCTION
 */
export async function uploadBufferToGCS(buffer: Buffer, gcsFileName: string, contentType: string): Promise<string> {
  debugLog("📦 Uploading buffer to GCS:", gcsFileName);

  const file = bucket.file(gcsFileName);
  const stream = Readable.from(buffer);

  return new Promise((resolve, reject) => {
    stream
      .pipe(
        file.createWriteStream({
          resumable: false,
          public: false,
          metadata: {
            contentType,
          },
        })
      )
      .on("error", (err) => {
        console.error("❌ GCS Buffer Upload Error:", err);
        reject(err);
      })
      .on("finish", () => {
        debugLog("✅ Buffer uploaded to GCS:", gcsFileName);
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsFileName}`;
        resolve(publicUrl);
      });
  });
}
