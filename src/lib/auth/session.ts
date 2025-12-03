import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { prisma } from '@/lib/db/prisma';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      subscriptionType: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

