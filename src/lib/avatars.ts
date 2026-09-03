export const DEFAULT_AVATARS = Array.from(
  { length: 20 },
  (_, index) => `/images/avatars/avatar-${String(index + 1).padStart(2, '0')}.png`,
);
