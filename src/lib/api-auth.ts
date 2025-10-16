import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export async function requireAuth(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      ),
      user: null,
    };
  }

  return {
    authenticated: true as const,
    response: undefined,
    user: {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    },
  };
}

export async function requireAdmin(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth.authenticated) {
    return auth;
  }

  if (auth.user?.role !== 'admin') {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      ),
      user: null,
    };
  }

  return auth;
}