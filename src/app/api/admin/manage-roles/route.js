import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';

export async function PUT(request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    });

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return Response.json({ 
        message: 'Only super admins can manage roles' 
      }, { status: 403 });
    }

    const { userId, newRole } = await request.json();

    // Validate role
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(newRole)) {
      return Response.json({ 
        message: 'Invalid role' 
      }, { status: 400 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    return Response.json({ 
      message: 'Role updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get all users for management
export async function GET(request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return Response.json({ 
        message: 'Insufficient permissions' 
      }, { status: 403 });
    }

    let users;
    if (currentUser.role === 'SUPER_ADMIN') {
      // Super admin can see all users
      users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else if (currentUser.role === 'ADMIN') {
      // Admin can only see regular users
      users = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' }
      });
    }

    return Response.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}