import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Folder } from '@/lib/models';
import { authenticate } from '@/lib/auth';
import { sortItems } from '@/lib/fileUtils';

// GET /api/folders - Get all folders for the authenticated user
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
    const parentId = searchParams.get('parentId');
    const sortBy = searchParams.get('sortBy') as 'name' | 'date' || 'name';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'asc';

    // Build query
    const query: any = {
      userId: user._id,
      isDeleted: false,
    };

    // Handle parentId filter
    if (parentId === 'root' || parentId === null) {
      query.parentId = null;
    } else if (parentId) {
      query.parentId = parentId;
    }

    const folders = await Folder.find(query)
      .populate('childrenCount')
      .populate('filesCount')
      .lean();

    // Sort folders using reusable sort function
    const sortedFolders = sortItems(folders, sortBy, order);

    return NextResponse.json({
      folders: sortedFolders,
    });
  } catch (error: any) {
    console.error('Get folders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, parentId } = body;

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

    // Check if parent folder exists and belongs to user (if parentId provided)
    if (parentId) {
      const parentFolder = await Folder.findOne({
        _id: parentId,
        userId: user._id,
        isDeleted: false,
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate folder name in the same directory
    const existingFolder = await Folder.findOne({
      name: trimmedName,
      userId: user._id,
      parentId: parentId || null,
      isDeleted: false,
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      );
    }

    // Create folder
    const folder = new Folder({
      name: trimmedName,
      userId: user._id,
      parentId: parentId || null,
    });

    await folder.save();

    return NextResponse.json(
      {
        message: 'Folder created successfully',
        folder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create folder error:', error);

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
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}