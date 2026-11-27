/** Tiny pathname router for clinic-nav screens. */

export type Route =
  | { name: 'invite'; token: string }
  | { name: 'intake' }
  | { name: 'pathway-result' }
  | { name: 'home' }
  | { name: 'preconsult' }
  | { name: 'handoff' }
  | { name: 'gp-match' }
  | { name: 'visit'; id: string }
  | { name: 'plan'; visitId: string }
  | { name: 'follow-up' }
  | { name: 'settings' }
  | { name: 'pdf-preview' };

/** Vite `base` without trailing slash, e.g. `/seasons/portal`. */
export function appBase(): string {
  const raw = import.meta.env.BASE_URL || '/';
  return raw.replace(/\/+$/, '') || '';
}

/** Strip deploy base so routes stay `/invite/demo`-style. */
export function stripBase(pathname: string): string {
  const base = appBase();
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    const rest = pathname.slice(base.length);
    return rest || '/';
  }
  return pathname;
}

/** Prefix a site-relative path with Vite base for history URLs. */
export function withBase(path: string): string {
  const base = appBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function parseRoute(pathname: string = window.location.pathname): Route {
  const path = stripBase(pathname).replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'invite') {
    return { name: 'invite', token: parts[1] || 'demo' };
  }
  if (parts[0] === 'intake') return { name: 'intake' };
  if (parts[0] === 'pathway' && parts[1] === 'result') {
    return { name: 'pathway-result' };
  }
  if (parts[0] === 'home') return { name: 'home' };
  if (parts[0] === 'preconsult') return { name: 'preconsult' };
  if (parts[0] === 'handoff') return { name: 'handoff' };
  if (parts[0] === 'gp' && parts[1] === 'match') return { name: 'gp-match' };
  if (parts[0] === 'gp' && parts[1] === 'follow-up') {
    return { name: 'follow-up' };
  }
  if (parts[0] === 'visit') {
    return { name: 'visit', id: parts[1] || 'demo-visit' };
  }
  if (parts[0] === 'plan') {
    return { name: 'plan', visitId: parts[1] || 'demo-visit' };
  }
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'pdf-preview') return { name: 'pdf-preview' };

  return { name: 'invite', token: 'demo' };
}

export function routePath(route: Route): string {
  let path: string;
  switch (route.name) {
    case 'invite':
      path = `/invite/${route.token}`;
      break;
    case 'intake':
      path = '/intake';
      break;
    case 'pathway-result':
      path = '/pathway/result';
      break;
    case 'home':
      path = '/home';
      break;
    case 'preconsult':
      path = '/preconsult';
      break;
    case 'handoff':
      path = '/handoff/whatsapp';
      break;
    case 'gp-match':
      path = '/gp/match';
      break;
    case 'visit':
      path = `/visit/${route.id}`;
      break;
    case 'plan':
      path = `/plan/${route.visitId}`;
      break;
    case 'follow-up':
      path = '/gp/follow-up';
      break;
    case 'settings':
      path = '/settings';
      break;
    case 'pdf-preview':
      path = '/pdf-preview';
      break;
  }
  return withBase(path);
}

export function navigate(route: Route, replace = false): void {
  const path = routePath(route);
  const url = path + window.location.search;
  if (replace) {
    history.replaceState(null, '', url);
  } else {
    history.pushState(null, '', url);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function preserveSearchNavigate(path: string, replace = false): void {
  const url = withBase(path) + window.location.search;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
