import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { user } = session;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: user.sub }
    });

    if (existingUser) {
      return Response.json({ user: existingUser });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        auth0Id: user.sub,
        email: user.email,
        name: user.name,
        role: 'USER'
      }
    });

    return Response.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}