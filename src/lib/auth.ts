import { cookies } from "next/headers";
import { env } from "./env";

export const ADMIN_COOKIE = "an_admin";

/** Server-side check used by admin pages (reads the httpOnly cookie). */
export function isAdmin(): boolean {
  return cookies().get(ADMIN_COOKIE)?.value === env.ADMIN_TOKEN;
}

/**
 * Guard for API route handlers. Accepts either the admin cookie or a
 * `Authorization: Bearer <ADMIN_TOKEN>` header (for scripts / cron callers).
 * Uses constant-time comparison to avoid token-timing leaks.
 */
export function authorizeRequest(req: Request): boolean {
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookie = cookies().get(ADMIN_COOKIE)?.value ?? null;
  const provided = bearer ?? cookie ?? "";
  return timingSafeEqual(provided, env.ADMIN_TOKEN);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
