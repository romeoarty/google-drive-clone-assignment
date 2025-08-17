import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { File, Folder } from '@/lib/models';
import { authenticate } from '@/lib/auth';
import {
  ensureUploadDir,
  generateUniqueFilename,
  validateFileUpload,
  UPLOAD_DIR,
  sortItems,
} from '@/lib/fileUtils';

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
    const query: any = {
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

    // Sort files using reusable sort function
    const sortedFiles = sortItems(files, sortBy, order);

    return NextResponse.json({
      files: sortedFiles,
    });
  } catch (error: any) {
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
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    const fullPath = path.join(process.cwd(), filePath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // Create file record in database
    const fileRecord = new File({
      name: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type.split('/')[0], // e.g., 'image', 'document'
      mimeType: file.type,
      path: filePath,
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
  } catch (error: any) {
    console.error('File upload error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(
        (err: any) => err.message
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