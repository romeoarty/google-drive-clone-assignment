import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { File } from '@/lib/models';
import { authenticate } from '@/lib/auth';

// GET /api/files/[id]/preview - Preview a file (with enhanced PDF handling)
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
        // For PDFs, we need to handle them specially
        // Some browsers can't display PDFs directly, so we'll provide options
        
        // Check if user wants to download or preview
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        
        if (action === 'download') {
          // Force download
          const response = NextResponse.redirect(file.cloudUrl);
          response.headers.set('Content-Type', 'application/pdf');
          response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
          return response;
        }
        
        // For preview, try to display inline
        const response = NextResponse.redirect(file.cloudUrl);
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', 'inline');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        
        return response;
      }
      
      // For images and other viewable files, redirect normally
      if (file.mimeType.startsWith('image/') || file.mimeType.startsWith('text/')) {
        return NextResponse.redirect(file.cloudUrl);
      }
      
      // For other file types, redirect to download
      return NextResponse.redirect(file.cloudUrl);
    }

    // For local files (fallback), return the file path
    if (file.storageType === 'local') {
      return NextResponse.json(
        { 
          error: 'Local file preview not supported. Please use cloud storage.',
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
    console.error('Preview file error:', error);
    return NextResponse.json(
      { error: 'Failed to preview file' },
      { status: 500 }
    );
  }
}
