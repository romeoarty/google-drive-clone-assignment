import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

// File size limits (in bytes)
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
export const ensureUploadDir = async (): Promise<void> => {
  try {
    await access(UPLOAD_DIR);
  } catch {
    // Directory doesn't exist, create it
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
  }
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `${timestamp}_${random}_${baseName}${extension}`;
};

// Delete file from filesystem
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    await access(fullPath); // Check if file exists
    await unlink(fullPath);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    // Don't throw error if file doesn't exist
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT') {
      throw error;
    }
  }
};

// Get file stats
export const getFileStats = async (filePath: string): Promise<fs.Stats | null> => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return await stat(fullPath);
  } catch (error) {
    console.error(`Error getting file stats for ${filePath}:`, error);
    return null;
  }
};