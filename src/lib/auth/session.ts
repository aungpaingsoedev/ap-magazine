import { headers } from 'next/headers';
import { auth, type AuthUser } from '@/lib/auth';
import type { UserRole } from '@/lib/db/schema';

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export type Permission =
  | 'admin.access'
  | 'articles.create'
  | 'articles.update_own'
  | 'articles.update_any'
  | 'articles.publish'
  | 'articles.delete'
  | 'taxonomy.manage'
  | 'authors.manage'
  | 'media.manage'
  | 'comments.moderate'
  | 'users.manage'
  | 'settings.manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'admin.access',
    'articles.create',
    'articles.update_own',
    'articles.update_any',
    'articles.publish',
    'articles.delete',
    'taxonomy.manage',
    'authors.manage',
    'media.manage',
    'comments.moderate',
    'users.manage',
    'settings.manage',
  ],
  editor: [
    'admin.access',
    'articles.create',
    'articles.update_own',
    'articles.update_any',
    'articles.publish',
    'articles.delete',
    'taxonomy.manage',
    'authors.manage',
    'media.manage',
    'comments.moderate',
  ],
  author: [
    'admin.access',
    'articles.create',
    'articles.update_own',
    'media.manage',
  ],
  media_manager: ['admin.access', 'media.manage'],
  viewer: [],
};

export function getUserRole(user: AuthUser): UserRole {
  const role = user.role as UserRole | undefined;
  if (role && role in ROLE_PERMISSIONS) return role;
  return 'viewer';
}

export function can(user: AuthUser, permission: Permission): boolean {
  return ROLE_PERMISSIONS[getUserRole(user)].includes(permission);
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!can(session.user, permission)) {
    throw new Error('Forbidden: insufficient permissions');
  }
  return session;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  editor: 4,
  author: 3,
  media_manager: 2,
  viewer: 1,
};

export function hasRole(user: AuthUser, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[getUserRole(user)] >= ROLE_HIERARCHY[minimumRole];
}

export async function requireRole(minimumRole: UserRole) {
  const session = await requireSession();
  if (!hasRole(session.user, minimumRole)) {
    throw new Error('Forbidden: insufficient permissions');
  }
  return session;
}

/** Permissions per role — kept for existing helpers */
export const PERMISSIONS = {
  content: {
    create: ['admin', 'editor', 'author'] as UserRole[],
    update: ['admin', 'editor', 'author'] as UserRole[],
    publish: ['admin', 'editor'] as UserRole[],
    delete: ['admin', 'editor'] as UserRole[],
    view: ['admin', 'editor', 'author', 'media_manager', 'viewer'] as UserRole[],
  },
} as const;

export function canPerform(
  user: AuthUser,
  action: keyof typeof PERMISSIONS.content,
): boolean {
  return PERMISSIONS.content[action].includes(getUserRole(user));
}
