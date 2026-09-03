export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export function fail(error: string): ActionResult<never> {
  return { success: false, error };
}

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function publicError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === 'Unauthorized' || err.message.startsWith('Forbidden')) {
      return err.message;
    }
  }
  console.error(err);
  return fallback;
}
