export function resolveApiBase(): string {
  const w: any = window as any;
  if (w.__API_BASE__) return w.__API_BASE__;
  const ls = localStorage.getItem('API_BASE');
  if (ls) return ls.replace(/\/$/, '');
  const { protocol, hostname, port } = window.location;
  // Se já está em alguma porta diferente, tenta a mesma porta; senão fallback 3000
  const apiPort = (port && port !== '4200') ? port : '3000';
  return `${protocol}//${hostname}:${apiPort}`;
}
