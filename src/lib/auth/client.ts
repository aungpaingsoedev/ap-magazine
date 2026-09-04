import { createAuthClient } from 'better-auth/react';

// Same-origin `/api/auth` — do not hardcode localhost or it breaks on Vercel.
export const authClient = createAuthClient();
