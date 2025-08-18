// Client-safe utility functions (no Node.js dependencies)

// File size limits (in bytes) - Increased for cloud storage
// Cloudinary free tier supports up to 100MB per file
export const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '104857600'); // 100MB default

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'video/mp4': '.mp4',
  'video/avi': '.avi',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'application/json': '.json',
};

// Get file extension from MIME type
export const getFileExtension = (mimeType: string): string => {
  return ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || '';
};

// Check if file type is allowed
export const isAllowedFileType = (mimeType: string): boolean => {
  return Object.prototype.hasOwnProperty.call(ALLOWED_FILE_TYPES, mimeType);
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Get file type category for display
export const getFileTypeCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Spreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'Archive';
  if (mimeType.includes('text')) return 'Text';
  return 'File';
};

// Check if file can be previewed
export const isPreviewable = (mimeType: string): boolean => {
  const previewableTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
  ];
  
  return previewableTypes.includes(mimeType);
};

// Validate file upload
export const validateFileUpload = (file: {
  size: number;
  type: string;
  name: string;
}): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}. Files are now stored in cloud storage with generous limits.`,
    };
  }

  // Check file type
  if (!isAllowedFileType(file.type)) {
    return {
      isValid: false,
      error: `File type '${file.type}' is not allowed`,
    };
  }

  // Check filename length
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Filename is too long (maximum 255 characters)',
    };
  }

  // Check for empty filename
  if (!file.name.trim()) {
    return {
      isValid: false,
      error: 'Filename cannot be empty',
    };
  }

  return { isValid: true };
};

// Custom file name sorting function
export const customFileNameSort = (a: string, b: string): number => {
  // Case-insensitive comparison
  const nameA = a.toLowerCase();
  const nameB = b.toLowerCase();
  
  // Natural sorting for numbers in filenames
  return nameA.localeCompare(nameB, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

// Sort files and folders with custom logic
export const sortItems = <T extends { name: string; createdAt: Date; updatedAt: Date }>(
  items: T[],
  sortBy: 'name' | 'date' | 'size' = 'name',
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return items.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = customFileNameSort(a.name, b.name);
        break;
      case 'date':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'size':
        // For items that have size property
        const sizeA = (a as { size?: number }).size || 0;
        const sizeB = (b as { size?: number }).size || 0;
        comparison = sizeA - sizeB;
        break;
      default:
        comparison = customFileNameSort(a.name, b.name);
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
};