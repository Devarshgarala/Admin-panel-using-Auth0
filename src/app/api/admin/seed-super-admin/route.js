import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, auth0Id, name } = await request.json();

    // Check if any super admin exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingSuperAdmin) {
      return Response.json({ 
        message: 'A super admin already exists' 
      }, { status: 400 });
    }

    // Create the first super admin
    const superAdmin = await prisma.user.upsert({
      where: { auth0Id },
      update: { role: 'SUPER_ADMIN' },
      create: {
        auth0Id,
        email,
        name: name || 'Super Admin',
        role: 'SUPER_ADMIN'
      }
    });

    return Response.json({ 
      message: 'Super admin created successfully',
      user: superAdmin 
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    return Response.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}