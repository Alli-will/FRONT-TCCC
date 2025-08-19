import { Component, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIf, NgClass } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { LoadingService } from "../services/loading.service";

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [RouterLink, NgIf, NgClass],
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.css"],
})
export class MenuComponent implements OnInit {
  isLoggedIn = false;
  dropdownOpen: boolean = false;
  sidebarOpen: boolean = window.innerWidth > 900; // Sidebar sempre expandido em telas grandes
  userName: string | null = null;
  userEmail: string | null = null;
  isAdmin = false;
  isSupport = false;
  isEmployee = false;
  avatarUrl: string | null = null; // object URL da imagem
  private avatarTs: number = Date.now();
  private objectUrl?: string; // para revogar quando necessário
  private avatarEtag: string | null = null; // última versão conhecida

  private isValidBase64(s: string): boolean {
    if (!s || typeof s !== 'string') return false;
    const trimmed = s.trim();
    if (trimmed.length === 0 || trimmed.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed);
  }

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private loading: LoadingService
  ) {}

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.sidebarOpen = window.innerWidth > 900;
    });
    // ouvir evento de atualização do avatar
    window.addEventListener('avatar-updated', (e: any) => {
  this.avatarTs = e?.detail?.ts || Date.now();
  // invalida etag para forçar refetch
  this.avatarEtag = null;
  this.refreshAvatar();
    });

    this.authService.currentUser.subscribe((token) => {
      this.isLoggedIn = !!token;
      if (token) {
        const payload = this.authService.getUserInfoFromToken();
        this.isAdmin = payload?.role === 'admin';
  this.isSupport = payload?.role === 'support';
  this.isEmployee = payload?.role === 'employee';
        this.userName = (payload?.first_Name && payload?.last_Name)
          ? `${payload.first_Name} ${payload.last_Name}`
          : payload?.first_Name || payload?.last_Name || payload?.email || null;
        this.userEmail = payload?.email || null;
        this.refreshAvatar();
      } else {
        this.userName = null;
        this.userEmail = null;
        this.isAdmin = false;
  this.isSupport = false;
  this.isEmployee = false;
        this.avatarUrl = null;
      }
    });
  }

  private refreshAvatar() {
    this.loading.block();
    if (!this.isLoggedIn) {
      if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = undefined; }
      this.avatarUrl = null;
      this.loading.unblock();
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) { this.loading.unblock(); return; }

    // Base da API dinâmica: localhost em dev, Railway em prod
    const apiBase = window.location.hostname.includes('localhost')
      ? 'https://tcc-main.up.railway.app'
      : 'https://tcc-main.up.railway.app';

    // Primeiro, consultar meta: hasAvatar + etag
  fetch(`${apiBase}/user/me/avatar/meta?ts=${this.avatarTs}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error('avatar-meta-failed');
        return r.json();
      })
      .then(data => {
        if (!data?.hasAvatar) {
          if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = undefined; }
          this.avatarUrl = null;
          this.avatarEtag = null;
          this.loading.unblock();
          return;
        }
        // Se etag não mudou e já temos URL, reaproveitar
        if (this.avatarEtag && data.etag && this.avatarEtag === data.etag && this.objectUrl) {
          this.avatarUrl = this.objectUrl;
          return;
        }
        // Buscar blob binário; só enviar If-None-Match se já tivermos etag anterior
        const headers: any = { 'Authorization': `Bearer ${token}` };
        if (this.avatarEtag) headers['If-None-Match'] = '"' + this.avatarEtag + '"';
        return fetch(`${apiBase}/user/me/avatar`, { headers })
          .then(resp => {
            if (resp.status === 304 && this.objectUrl) {
              this.avatarUrl = this.objectUrl;
              this.avatarEtag = data.etag || this.avatarEtag;
              return null;
            }
            if (!resp.ok) throw new Error('avatar-fetch-failed');
            this.avatarEtag = data.etag || null;
            return resp.blob();
          })
          .then(blob => {
            if (!blob || (blob as any).size === 0) return; // 304 ou 204 sem conteúdo
            if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = URL.createObjectURL(blob);
            this.avatarUrl = this.objectUrl;
          });
      })
      .catch(async () => {
        // Fallback 1: endpoint base64 antigo
        try {
          const r = await fetch(`${apiBase}/user/me/avatar/base64?ts=${this.avatarTs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (r.ok) {
            const data = await r.json();
            if (data?.hasAvatar && typeof data.base64 === 'string' && this.isValidBase64(data.base64)) {
              const mime = data.mimeType || 'image/png';
              this.avatarUrl = `data:${mime};base64,${data.base64}`;
              return;
            }
          }
        } catch {}
        // Fallback 2: tentar blob direto sem ETag
        try {
          const r2 = await fetch(`${apiBase}/user/me/avatar?ts=${this.avatarTs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (r2.ok) {
            const blob = await r2.blob();
            if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = undefined; }
            this.objectUrl = URL.createObjectURL(blob);
            this.avatarUrl = this.objectUrl;
    return;
          }
        } catch {}
        // Se tudo falhar, limpar estado
        if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = undefined; }
        this.avatarUrl = null;
        this.avatarEtag = null;
  })
  .finally(() => this.loading.unblock());
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
  logout() {
    this.authService.logout();
  }

  preencherCadastroComUsuarioLogado() {
    const payload = this.authService.getUserInfoFromToken();
    if (payload) {
      localStorage.setItem(
        "cadastroUser",
        JSON.stringify({
          firstName: payload.first_Name || payload.firstName || "",
          lastName: payload.last_Name || payload.lastName || "",
          email: payload.email || "",
          password: "", 
          companyId: payload.companyId || 1,
        })
      );
    }
  }

  showComingSoon() {
    alert('Em breve!');
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  get isMobileScreen(): boolean {
    return window.innerWidth <= 900;
  }
}
