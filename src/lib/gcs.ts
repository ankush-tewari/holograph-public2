import { Storage } from '@google-cloud/storage';
import fs from 'fs';

// ✅ Ensure environment variables are correctly set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS is missing.');
} else if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('❌ Service account key file does not exist at:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  console.log('🟢 Found service account key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

if (!process.env.GOOGLE_CLOUD_PROJECT) {
  console.error('❌ GOOGLE_CLOUD_PROJECT is missing.');
} else {
  console.log('🟢 Google Cloud Project:', process.env.GOOGLE_CLOUD_PROJECT);
}

if (!process.env.GCS_BUCKET_NAME) {
  console.error('❌ GCS_BUCKET_NAME is missing.');
} else {
  console.log('🟢 Using Google Cloud Storage Bucket:', process.env.GCS_BUCKET_NAME);
}

// ✅ Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

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
      console.log('🔄 Original filePath from database:', filePath);

      // ✅ Ensure we are only using the relative object path
      let gcsFilePath = filePath.trim(); // Ensure no extra spaces

      console.log('🟢 Corrected GCS file path for deletion:', gcsFilePath);
      const file = bucket.file(gcsFilePath);

      file.delete()
        .then(() => {
          console.log('✅ File successfully deleted from GCS:', gcsFilePath);
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

    console.log('🟢 Starting file upload:', gcsFileName);
    const fileUpload = bucket.file(gcsFileName);

    fs.createReadStream(file.filepath)
      .pipe(
        fileUpload.createWriteStream({
          resumable: false,
          public: false,
          metadata: { contentType: file.mimetype },
        })
      )
      .on('error', (err) => {
        console.error('❌ GCS Upload Error:', err);
        reject(err);
      })
      .on('finish', async () => {
        console.log('✅ File successfully uploaded to GCS:', gcsFileName);
        resolve(gcsFileName); // ✅ Return only the object name
      });
  });
}
