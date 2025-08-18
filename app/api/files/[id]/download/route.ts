import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { File } from '@/lib/models';
import { authenticate } from '@/lib/auth';

// GET /api/files/[id]/download - Download a file (with enhanced PDF support)
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

    // Await params to get the actual values
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

    // For cloud storage, handle different file types appropriately
    if (file.storageType === 'cloud' && file.cloudUrl) {
      // Special handling for PDF files
      if (file.mimeType === 'application/pdf') {
        // For PDFs, redirect to Cloudinary with download headers
        const response = NextResponse.redirect(file.cloudUrl);
        
        // Add PDF-specific download headers
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        response.headers.set('Cache-Control', 'private, max-age=3600');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        
        return response;
      }
      
      // For other file types, redirect with standard download headers
      const response = NextResponse.redirect(file.cloudUrl);
      
      // Add standard download headers
      response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      response.headers.set('Cache-Control', 'private, max-age=3600');
      
      return response;
    }

    // For local files (fallback), return error
    if (file.storageType === 'local') {
      return NextResponse.json(
        { 
          error: 'Local file download not supported. Please use cloud storage.',
          filePath: file.path 
        },
        { status: 400 }
      );
    }

    // If no valid storage type found
    return NextResponse.json(
      { error: 'File storage type not supported' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}