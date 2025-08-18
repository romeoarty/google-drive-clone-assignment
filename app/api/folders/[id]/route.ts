import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Folder, File } from '@/lib/models';
import { authenticate } from '@/lib/auth';

// GET /api/folders/[id] - Get a specific folder
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

    const folder = await Folder.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    })
      .populate('childrenCount')
      .populate('filesCount');

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ folder });
  } catch (error: unknown) {
    console.error('Get folder error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    );
  }
}

// PUT /api/folders/[id] - Update folder name
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
    const { name } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Folder name cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Folder name cannot exceed 100 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Find the folder
    const folder = await Folder.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check for duplicate folder name in the same directory
    const existingFolder = await Folder.findOne({
      name: trimmedName,
      userId: user._id,
      parentId: folder.parentId,
      isDeleted: false,
      _id: { $ne: id }, // Exclude current folder
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      );
    }

    // Update folder
    folder.name = trimmedName;
    await folder.save();

    return NextResponse.json({
      message: 'Folder updated successfully',
      folder,
    });
  } catch (error: unknown) {
    console.error('Update folder error:', error);

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
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[id] - Delete a folder (soft delete)
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

    // Find the folder
    const folder = await Folder.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Recursively soft delete all subfolders and files
    await softDeleteFolderRecursive(id, user._id);

    return NextResponse.json({
      message: 'Folder deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

// Helper function to recursively soft delete folders and files
async function softDeleteFolderRecursive(folderId: string, userId: string) {
  // Soft delete the folder
  await Folder.findOneAndUpdate(
    { _id: folderId, userId },
    { isDeleted: true, deletedAt: new Date() }
  );

  // Find and soft delete all files in this folder
  await File.updateMany(
    { folderId, userId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() }
  );

  // Find all subfolders and recursively delete them
  const subfolders = await Folder.find({
    parentId: folderId,
    userId,
    isDeleted: false,
  });

  for (const subfolder of subfolders) {
    await softDeleteFolderRecursive(subfolder._id.toString(), userId);
  }
}