import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { File } from '@/lib/models';
import { authenticate } from '@/lib/auth';

// GET /api/files/[id] - Get a specific file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const file = await File.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ file });
  } catch (error: unknown) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

// PUT /api/files/[id] - Update file name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { originalName } = body;

    // Validation
    if (!originalName || typeof originalName !== 'string') {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    const trimmedName = originalName.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'File name cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 255) {
      return NextResponse.json(
        { error: 'File name cannot exceed 255 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Find the file
    const file = await File.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if a file with the same name already exists in the same folder
    const existingFile = await File.findOne({
      originalName: trimmedName,
      userId: user._id,
      folderId: file.folderId,
      isDeleted: false,
      _id: { $ne: id }, // Exclude current file
    });

    if (existingFile) {
      return NextResponse.json(
        { error: 'A file with this name already exists in this location' },
        { status: 409 }
      );
    }

    // Update file
    file.originalName = trimmedName;
    await file.save();

    return NextResponse.json({
      message: 'File updated successfully',
      file,
    });
  } catch (error: unknown) {
    console.error('Update file error:', error);

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
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[id] - Delete a file (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Find the file
    const file = await File.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Soft delete the file record
    await File.findOneAndUpdate(
      { _id: id, userId: user._id },
      { isDeleted: true, deletedAt: new Date() }
    );

    // Optionally delete the physical file (uncomment if you want to delete immediately)
    // try {
    //   await deleteFile(file.path);
    // } catch (error) {
    //   console.error('Error deleting physical file:', error);
    //   // Don't fail the request if physical file deletion fails
    // }

    return NextResponse.json({
      message: 'File deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}