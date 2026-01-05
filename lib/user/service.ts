import { db } from '@/lib/db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export async function getUserById(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0] || null;
}


export function dollarsTocents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function getUserBalance(userId: string): Promise<string> {
  const user = await getUserById(userId);
  const balanceInCents = user?.balance || 0;
  return centsToDollarsString(balanceInCents);
}

export async function getUserBalanceInCents(userId: string): Promise<number> {
  const user = await getUserById(userId);
  return user?.balance || 0;
}

export async function updateUserBalance(userId: string, balanceInCents: number) {
  return await db.update(users)
    .set({ balance: balanceInCents })
    .where(eq(users.id, userId));
}