import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return { authenticated: false, user: null };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    },
  };
}