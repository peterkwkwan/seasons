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

export function parseRoute(pathname: string = window.location.pathname): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
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
  switch (route.name) {
    case 'invite':
      return `/invite/${route.token}`;
    case 'intake':
      return '/intake';
    case 'pathway-result':
      return '/pathway/result';
    case 'home':
      return '/home';
    case 'preconsult':
      return '/preconsult';
    case 'handoff':
      return '/handoff/whatsapp';
    case 'gp-match':
      return '/gp/match';
    case 'visit':
      return `/visit/${route.id}`;
    case 'plan':
      return `/plan/${route.visitId}`;
    case 'follow-up':
      return '/gp/follow-up';
    case 'settings':
      return '/settings';
    case 'pdf-preview':
      return '/pdf-preview';
  }
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
  const url = path + window.location.search;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
