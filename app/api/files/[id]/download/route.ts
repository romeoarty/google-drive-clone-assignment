import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { File } from '@/lib/models';
import { authenticate } from '@/lib/auth';

// GET /api/files/[id]/download - Download a file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Find the file
    const file = await File.findOne({
      _id: params.id,
      userId: user._id,
      isDeleted: false,
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    try {
      // Read file from filesystem using fs module (addressing feedback)
      const fullPath = path.join(process.cwd(), file.path);
      const fileBuffer = await readFile(fullPath);

      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': file.mimeType,
          'Content-Length': file.size.toString(),
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });

      return response;
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}