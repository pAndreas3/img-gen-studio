'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/user/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';
import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function registerWithCredentials(formData: FormData) {
    const email = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Check if user already exists
    const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email));

    if (existingUser.length > 0) {
        // User already exists, redirect with error
        redirect('/register?error=User already exists');
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    await db.insert(users).values({
        email,
        passwordHash,
        name: null,
        balance: 0,
    });

    // Sign in the user
    await signIn('credentials', { 
        username: email, 
        password: password,
        redirectTo: '/' 
    });
}


