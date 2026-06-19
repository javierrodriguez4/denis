import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];
const CHANGE_PASSWORD_PATH = "/cambiar-clave";

/**
 * Refreshes the Supabase session on every request and decides redirects.
 *
 * Follows the official @supabase/ssr pattern: it creates a response, wires the
 * cookie getAll/setAll to BOTH the incoming request and the outgoing response
 * so the refreshed session is propagated, then calls getUser() (which performs
 * the refresh). Do NOT run any logic between client creation and getUser().
 *
 * Redirect rules:
 *  - no session and path is not public (/login) -> /login
 *  - session and user_metadata.must_change_password === true and
 *    path !== /cambiar-clave -> /cambiar-clave
 *  - path starts with /admin and app_metadata.role !== 'admin' -> /
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase is not configured, let the request through untouched so the
  // app can still render its "configure Supabase" states.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // No session -> force /login (except on public paths).
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const mustChangePassword =
      user.user_metadata?.must_change_password === true;
    const role = user.app_metadata?.role;

    // Already logged in but landing on /login -> go home (or change-password).
    if (isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = mustChangePassword ? CHANGE_PASSWORD_PATH : "/";
      return NextResponse.redirect(url);
    }

    // Forced password change on first login.
    if (mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = CHANGE_PASSWORD_PATH;
      return NextResponse.redirect(url);
    }

    // Admin-only area.
    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: return supabaseResponse as-is so refreshed cookies are kept.
  return supabaseResponse;
}
