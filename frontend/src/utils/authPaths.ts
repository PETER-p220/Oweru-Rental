/** Routes that do not require login — stale tokens here should not redirect to /login. */
export function isPublicAppPath(pathname: string): boolean {
  if (pathname === '/') return true;

  const publicPrefixes = [
    '/login',
    '/register',
    '/properties',
    '/property/',
    '/bnb/',
    '/about',
    '/contact',
    '/auth/',
  ];

  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

export function isProtectedAppPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}
