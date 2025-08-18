import { NextRequest, NextResponse } from 'next/server';
import { authenticate, sanitizeUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: sanitizeUser(user),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get user error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}