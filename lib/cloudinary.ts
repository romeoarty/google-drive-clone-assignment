import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Upload file to Cloudinary
export const uploadToCloudinary = async (
  file: Buffer,
  filename: string,
  folder: string = 'google-drive-clone'
): Promise<{ url: string; public_id: string; secure_url: string }> => {
  try {
    // Convert buffer to base64 for Cloudinary
    const base64File = `data:application/octet-stream;base64,${file.toString('base64')}`;
    
    const result = await cloudinary.uploader.upload(base64File, {
      folder,
      public_id: filename.replace(/\.[^/.]+$/, ''), // Remove file extension
      resource_type: 'auto', // Auto-detect file type
      overwrite: false, // Don't overwrite existing files
      unique_filename: true, // Ensure unique filenames
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from cloud storage');
  }
};

// Get file info from Cloudinary
export const getFileInfo = async (publicId: string) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get info error:', error);
    throw new Error('Failed to get file info from cloud storage');
  }
};
