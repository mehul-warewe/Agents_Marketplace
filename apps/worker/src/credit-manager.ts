import { createClient, users, transactions, eq, sql } from '@repo/database';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const db = createClient(process.env.POSTGRES_URL!);

/**
 * Deducts credits from a user's account and logs the transaction.
 * @param userId The ID of the user.
 * @param amount The number of credits to deduct.
 * @param description Description of the deduction.
 * @returns Object indicating success and total remaining credits.
 */
export async function deductCredits(userId: string, amount: number, description: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.credits < amount) {
      return { success: false, error: 'Insufficient credits', balance: user.credits };
    }

    await db.transaction(async (tx) => {
      // 1. Deduct credits
      await tx.update(users)
        .set({ credits: sql`${users.credits} - ${amount}` })
        .where(eq(users.id, userId));

      // 2. Log transaction
      await tx.insert(transactions).values({
        userId,
        amount: -amount, // Negative for deduction
        type: 'usage',
        description,
      });
    });

    return { success: true, balance: user.credits - amount };
  } catch (error: any) {
    console.error(`Failed to deduct credits for user ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Checks if a user has enough credits for a specific action.
 */
export async function hasSufficientCredits(userId: string, amount: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { credits: true },
  });
  return (user?.credits ?? 0) >= amount;
}
