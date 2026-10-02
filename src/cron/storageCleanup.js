import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import path from 'path';
import fs from 'fs';

// Initialize S3
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  forcePathStyle: true, 
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'default';

async function cleanupStorage() {
  console.log('[Cron] Starting storage cleanup...');
  try {
    // 1. Gather all used URLs from the Database
    const users = await prisma.user.findMany({ select: { avatarUrl: true } });
    const trips = await prisma.trip.findMany({ select: { imageUrl: true } });
    const docs = await prisma.userDocument.findMany({ select: { fileUrl: true } });

    // Collect into a Set of filenames
    const usedFilenames = new Set();
    const extractFilename = (url) => {
      if (!url) return null;
      // Extracts the filename from URL (e.g. https://.../uploads/file.webp -> file.webp)
      const parts = url.split('/');
      return parts[parts.length - 1];
    };

    users.forEach(u => { const f = extractFilename(u.avatarUrl); if (f) usedFilenames.add(f); });
    trips.forEach(t => { const f = extractFilename(t.imageUrl); if (f) usedFilenames.add(f); });
    docs.forEach(d => { const f = extractFilename(d.fileUrl); if (f) usedFilenames.add(f); });

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    let deletedCount = 0;

    if (process.env.USE_CLOUD_STORAGE === 'true') {
      // 2. Clean S3 Storage
      let isTruncated = true;
      let continuationToken = undefined;

      while (isTruncated) {
        const response = await s3.send(new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: 'uploads/',
          ContinuationToken: continuationToken
        }));

        const contents = response.Contents || [];
        
        for (const object of contents) {
          const filename = object.Key.split('/').pop();
          if (!filename) continue; // Skip directory markers

          const isOrphan = !usedFilenames.has(filename);
          const ageMs = now - object.LastModified.getTime();

          // Delete if orphan AND older than 24 hours
          if (isOrphan && ageMs > ONE_DAY_MS) {
            console.log(`[Cron] Deleting orphan S3 object: ${object.Key}`);
            await s3.send(new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: object.Key
            }));
            deletedCount++;
          }
        }

        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
      }
    } else {
      // 3. Clean Local Disk Storage
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
          const isOrphan = !usedFilenames.has(file);
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          const ageMs = now - stats.mtimeMs;

          if (isOrphan && ageMs > ONE_DAY_MS) {
            console.log(`[Cron] Deleting orphan local file: ${file}`);
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
    }

    console.log(`[Cron] Storage cleanup completed. Removed ${deletedCount} orphan files.`);
  } catch (error) {
    console.error('[Cron] Storage cleanup failed:', error);
  }
}

// Export a function to initialize the cron job
export function initCronJobs() {
  // Run at 03:00 AM every day
  cron.schedule('0 3 * * *', cleanupStorage);
  console.log('[Cron] Storage cleanup job scheduled for 03:00 AM daily.');
}

// If this file is run directly via the command line (e.g., by Voroa Scheduled Tasks)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanupStorage().then(() => {
    console.log('[Cron] Standalone execution completed.');
    process.exit(0);
  });
}
