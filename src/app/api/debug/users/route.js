import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        auth0Id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return Response.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}