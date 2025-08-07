import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';

// Get users based on role permissions
export async function GET() {
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
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          auth0Id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } else if (currentUser.role === 'ADMIN') {
      // Admin can only see regular users
      users = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          auth0Id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    return Response.json({ users, currentUserRole: currentUser.role });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Update user (name only for regular users, full update for admins/super-admins)
export async function PUT(request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { userId, updates } = await request.json();

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    });

    if (!currentUser) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return Response.json({ message: 'Target user not found' }, { status: 404 });
    }

    let allowedUpdates = {};

    if (currentUser.role === 'SUPER_ADMIN') {
      // Super admin can update everything
      allowedUpdates = updates;
    } else if (currentUser.role === 'ADMIN') {
      // Admin can update name and role (but only for regular users)
      if (targetUser.role === 'USER') {
        allowedUpdates = {
          name: updates.name,
          ...(updates.role && ['USER', 'ADMIN'].includes(updates.role) ? { role: updates.role } : {})
        };
      } else {
        return Response.json({ message: 'Cannot update admin/super-admin users' }, { status: 403 });
      }
    } else if (currentUser.role === 'USER') {
      // Regular users can only update their own name
      if (currentUser.id === userId) {
        allowedUpdates = { name: updates.name };
      } else {
        return Response.json({ message: 'Can only update your own profile' }, { status: 403 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates
    });

    return Response.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}