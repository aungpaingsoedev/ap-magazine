import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { slugify } from '@/lib/slug';

const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  trustedOrigins: [
    appUrl,
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter((origin): origin is string => Boolean(origin)),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  account: {
    storeStateStrategy: 'cookie',
  },
  onAPIError: {
    errorURL: `${appUrl}/login`,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'author',
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          const isAdmin =
            Boolean(adminEmail) && created.email.toLowerCase() === adminEmail;
          const base = slugify(created.name || created.email.split('@')[0]);
          await db
            .update(schema.user)
            .set({
              role: isAdmin ? 'admin' : 'author',
              slug: base || created.id,
              username: base || created.id,
              updatedAt: new Date(),
            })
            .where(eq(schema.user.id, created.id));
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session['user'];
