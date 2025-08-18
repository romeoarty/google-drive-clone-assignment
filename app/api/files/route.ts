import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { File, Folder } from '@/lib/models';
import { authenticate } from '@/lib/auth';
import {
  ensureUploadDir,
  generateUniqueFilename,
  getConsistentUploadDir,
} from '@/lib/fileUtils';
import { validateFileUpload } from '@/lib/clientUtils';
import { access } from 'fs/promises';

// GET /api/files - Get all files for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const sortBy = searchParams.get('sortBy') as 'name' | 'date' | 'size' || 'name';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'asc';

    // Build query
    const query: {
      userId: string;
      isDeleted: boolean;
      folderId?: string | null;
    } = {
      userId: user._id,
      isDeleted: false,
    };

    // Handle folderId filter
    if (folderId === 'root' || folderId === null) {
      query.folderId = null;
    } else if (folderId) {
      query.folderId = folderId;
    }

    const files = await File.find(query).lean();

    // Sort files
    const sortedFiles = files.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.originalName || a.name).localeCompare(b.originalName || b.name, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        default:
          comparison = (a.originalName || a.name).localeCompare(b.originalName || b.name, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    return NextResponse.json({
      files: sortedFiles,
    });
  } catch (error: unknown) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// POST /api/files - Upload a new file
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file upload
    const validation = validateFileUpload({
      size: file.size,
      type: file.type,
      name: file.name,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if folder exists and belongs to user (if folderId provided)
    if (folderId && folderId !== 'root') {
      const folder = await Folder.findOne({
        _id: folderId,
        userId: user._id,
        isDeleted: false,
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate file name in the same directory
    const existingFile = await File.findOne({
      originalName: file.name,
      userId: user._id,
      folderId: folderId === 'root' ? null : folderId,
      isDeleted: false,
    });

    if (existingFile) {
      return NextResponse.json(
        { error: 'A file with this name already exists in this location' },
        { status: 409 }
      );
    }

    // Generate unique filename and save file
    const uniqueFilename = generateUniqueFilename(file.name);
    const uploadDir = getConsistentUploadDir();
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Handle absolute paths correctly (especially for Vercel /tmp)
    const fullPath = uploadDir.startsWith('/') ? filePath : path.join(process.cwd(), filePath);
    
    console.log(`Upload directory: ${uploadDir}`);
    console.log(`File path: ${filePath}`);
    console.log(`Full path: ${fullPath}`);

    // Validate the upload directory is accessible
    try {
      await access(uploadDir);
      console.log(`Upload directory is accessible: ${uploadDir}`);
    } catch (dirError) {
      console.error(`Upload directory not accessible: ${uploadDir}`, dirError);
      throw new Error(`Upload directory not accessible: ${uploadDir}`);
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      await writeFile(fullPath, buffer);
      console.log(`File saved successfully to: ${fullPath}`);
    } catch (writeError: unknown) {
      console.error(`Failed to write file to: ${fullPath}`, writeError);
      const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error';
      throw new Error(`Failed to save file: ${errorMessage}`);
    }

    // Create file record in database
    // Store the full path for Vercel compatibility, or relative path for local development
    const pathToStore = uploadDir.startsWith('/') ? filePath : path.relative(process.cwd(), filePath);
    
    const fileRecord = new File({
      name: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type.split('/')[0], // e.g., 'image', 'document'
      mimeType: file.type,
      path: pathToStore,
      userId: user._id,
      folderId: folderId === 'root' ? null : folderId,
    });

    await fileRecord.save();

    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        file: fileRecord,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('File upload error:', error);

    // Handle specific Vercel payload size errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as { message: string }).message;
      if (errorMessage.includes('Request Entity Too Large') || errorMessage.includes('FUNCTION_PAYLOAD_TOO_LARGE')) {
        return NextResponse.json(
          { 
            error: 'File too large. Due to Vercel serverless limitations, files cannot exceed 4MB. Please reduce file size or use cloud storage for larger files.' 
          },
          { status: 413 }
        );
      }
    }

    // Handle mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError' && 'errors' in error) {
      const validationError = error as unknown as { errors: Record<string, { message: string }> };
      const errorMessages = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: errorMessages.join('. ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}