import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Check if any super admin exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingSuperAdmin) {
      return Response.json({ 
        message: 'A super admin already exists',
        user: existingSuperAdmin 
      }, { status: 400 });
    }

    // Update current user to super admin
    const updatedUser = await prisma.user.update({
      where: { auth0Id: session.user.sub },
      data: { role: 'SUPER_ADMIN' }
    });

    return Response.json({ 
      message: 'Successfully promoted to super admin',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating to super admin:', error);
    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}