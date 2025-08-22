export function resolveApiBase(): string {
  try {
    const w: any = window as any;
    if (w.__API_BASE__) return w.__API_BASE__;
    const ls = localStorage.getItem('API_BASE');
    if (ls) return ls.replace(/\/$/, '');
    const { protocol, hostname, port } = window.location;
    // Ambientes de dev Angular (4200) e SSR (4000) apontam para backend 3000
    if (port === '4200' || port === '4000') return `${protocol}//${hostname}:3000`;
    // Se não há porta (produção) usa o host direto
    if (!port) return `${protocol}//${hostname}`;
    return `${protocol}//${hostname}:${port}`;
  } catch {
    // Fallback server-side (SSR) ou erro de acesso a window
    return 'https://tcc-main.up.railway.app';
  }
}
