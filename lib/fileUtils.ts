import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

// File size limits (in bytes) - Reduced for Vercel compatibility
// Vercel has a 4.5MB payload limit for serverless functions
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '4194304'); // 4MB default for Vercel
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Ensure upload directory exists
export const ensureUploadDir = async (): Promise<void> => {
  try {
    // On Vercel, use /tmp directory for temporary file storage
    if (isVercel) {
      const tmpDir = '/tmp';
      try {
        await access(tmpDir);
        console.log(`Using Vercel temp directory: ${tmpDir}`);
        return;
      } catch {
        console.warn('Vercel temp directory not accessible, falling back to local uploads');
      }
    }

    // Try to access the upload directory
    await access(UPLOAD_DIR);
    console.log(`Upload directory accessible: ${UPLOAD_DIR}`);
  } catch {
    try {
      // Directory doesn't exist, create it
      await mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${UPLOAD_DIR}`);
    } catch (mkdirError) {
      console.error(`Failed to create upload directory: ${UPLOAD_DIR}`, mkdirError);
      
      // If we're on Vercel and can't create the directory, try using /tmp
      if (isVercel) {
        try {
          await access('/tmp');
          console.log('Using Vercel temp directory as fallback');
          return;
        } catch (tmpError) {
          console.error('Vercel temp directory also not accessible:', tmpError);
          
          // Last resort: try to create uploads in the current working directory
          try {
            const fallbackDir = path.join(process.cwd(), 'uploads');
            await mkdir(fallbackDir, { recursive: true });
            console.log(`Created fallback upload directory: ${fallbackDir}`);
            return;
          } catch (fallbackError) {
            console.error('All upload directory creation attempts failed:', fallbackError);
            throw new Error('Cannot create or access any upload directory. Please check file permissions.');
          }
        }
      }
      
      throw mkdirError;
    }
  }
};

// Validate file path and ensure it's accessible
export const validateFilePath = async (filePath: string): Promise<boolean> => {
  try {
    // Handle absolute paths correctly (especially for Vercel /tmp)
    const fullPath = filePath.startsWith('/') ? filePath : path.join(process.cwd(), filePath);
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
};

// Get the appropriate upload directory path
export const getUploadDir = (): string => {
  if (isVercel) {
    try {
      // Check if /tmp is accessible
      fs.accessSync('/tmp');
      console.log('Using Vercel temp directory for uploads: /tmp');
      return '/tmp';
    } catch {
      console.log('Vercel temp directory not accessible, using local uploads');
      // Fallback to local uploads directory
      return UPLOAD_DIR;
    }
  }
  
  // In development or non-Vercel production, use local uploads
  console.log(`Using local upload directory: ${UPLOAD_DIR}`);
  return UPLOAD_DIR;
};

// Get consistent upload directory (cached for the current request)
let cachedUploadDir: string | null = null;
export const getConsistentUploadDir = (): string => {
  if (cachedUploadDir === null) {
    cachedUploadDir = getUploadDir();
    console.log(`Cached upload directory: ${cachedUploadDir}`);
  }
  return cachedUploadDir;
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
    // Handle absolute paths correctly (especially for Vercel /tmp)
    const fullPath = filePath.startsWith('/') ? filePath : path.join(process.cwd(), filePath);
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
    // Handle absolute paths correctly (especially for Vercel /tmp)
    const fullPath = filePath.startsWith('/') ? filePath : path.join(process.cwd(), filePath);
    return await stat(fullPath);
  } catch (error) {
    console.error(`Error getting file stats for ${filePath}:`, error);
    return null;
  }
};