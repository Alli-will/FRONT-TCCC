import { Component, OnInit, OnDestroy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIf, NgClass } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { LoadingService } from "../services/loading.service";
import { resolveApiBase } from "../services/api-base";

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [RouterLink, NgIf, NgClass],
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.css"],
})
export class MenuComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  dropdownOpen: boolean = false;
  sidebarOpen: boolean = window.innerWidth > 1330; // Sidebar sempre expandido em telas grandes
  isMobileScreen: boolean = window.innerWidth <= 1330;
  userName: string | null = null;
  userEmail: string | null = null;
  isAdmin = false;
  isSupport = false;
  isEmployee = false;
  avatarUrl: string | null = null; // object URL da imagem
  private avatarTs: number = Date.now();
  private objectUrl?: string; // para revogar quando necessário
  private avatarEtag: string | null = null; // última versão conhecida
  modalOpen = false; // bloqueia interação quando modal global aberto

  private isValidBase64(s: string): boolean {
    if (!s || typeof s !== "string") return false;
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
    window.addEventListener("resize", () => {
      this.sidebarOpen = window.innerWidth > 1330;
      this.isMobileScreen = window.innerWidth <= 1330;
    });
    // ouvir evento de atualização do avatar
    window.addEventListener("avatar-updated", (e: any) => {
      this.avatarTs = e?.detail?.ts || Date.now();
      // invalida etag para forçar refetch
      this.avatarEtag = null;
      this.refreshAvatar();
    });

    // Atualiza o nome exibido quando o perfil for salvo (sem depender do token mudar)
    const profileHandler = (e: any) => {
      const dnFirst = (e?.detail?.firstName || e?.detail?.first_Name || "").toString().trim();
      const dnLast = (e?.detail?.lastName || e?.detail?.last_Name || "").toString().trim();
      // Exibir exatamente o conteúdo do campo Nome (first_Name) quando houver; se vazio, cair para Sobrenome e depois e-mail
      const display = dnFirst || dnLast || (this.userEmail ? this.userEmail.split("@")[0] : null);
      this.userName = display;
    };
    window.addEventListener("profile-updated", profileHandler);
    (this as any)._profileHandler = profileHandler;

    this.authService.currentUser.subscribe((token) => {
      this.isLoggedIn = !!token;
      if (token) {
        // Token mudou (login ou troca de usuário): zera cache do avatar para evitar reuso indevido
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
          this.objectUrl = undefined;
        }
        this.avatarUrl = null;
        this.avatarEtag = null;
        this.avatarTs = Date.now();
        const payload = this.authService.getUserInfoFromToken();
  // papel do usuário (admin/employee/support)
        this.isAdmin = payload?.role === "admin";
        this.isSupport = payload?.role === "support";
        this.isEmployee = payload?.role === "employee";
  // Exibir exatamente o campo first_Name (se presente), senão last_Name, senão parte local do e-mail
  const pf = (payload?.first_Name || payload?.firstName || "").toString().trim();
  const pl = (payload?.last_Name || payload?.lastName || "").toString().trim();
  this.userName = pf || pl || (payload?.email ? (payload.email.split("@")[0] || null) : null);
        this.userEmail = payload?.email || null;
        // Após recarregar a página, o token pode estar desatualizado em relação ao banco.
        // Busca o usuário atual no backend e sobrescreve o nome exibido com o first_Name real.
        this.userService.getCurrentUser().subscribe({
          next: (u: any) => {
            const first = (u?.first_Name || u?.firstName || "").toString().trim();
            const last = (u?.last_Name || u?.lastName || "").toString().trim();
            // Regra: exibir exatamente o campo de Nome (first)
            this.userName = first || last || (this.userEmail ? this.userEmail.split("@")[0] : null);
          },
          error: () => {
            // mantém valor derivado do token em caso de falha
          },
        });
        this.refreshAvatar();
      } else {
        this.userName = null;
        this.userEmail = null;
        this.isAdmin = false;
        this.isSupport = false;
        this.isEmployee = false;
        this.avatarUrl = null;
        // Também limpar ETag e revogar URL para garantir estado limpo
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
          this.objectUrl = undefined;
        }
        this.avatarEtag = null;
      }
    });

    // ouvir eventos globais de abertura/fechamento de modais que travam a página
    const openHandler = () => {
      this.modalOpen = true;
    };
    const closeHandler = () => {
      this.modalOpen = false;
    };
    window.addEventListener("body-modal-open", openHandler);
    window.addEventListener("body-modal-close", closeHandler);
    // guardar para remoção
    (this as any)._modalHandlers = { openHandler, closeHandler };
  }

  ngOnDestroy(): void {
    const h = (this as any)._modalHandlers;
    if (h) {
      window.removeEventListener("body-modal-open", h.openHandler);
      window.removeEventListener("body-modal-close", h.closeHandler);
    }
    const ph = (this as any)._profileHandler;
    if (ph) {
      window.removeEventListener("profile-updated", ph);
    }
  }

  private refreshAvatar() {
    this.loading.block();
    if (!this.isLoggedIn) {
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = undefined;
      }
      this.avatarUrl = null;
      this.loading.unblock();
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      this.loading.unblock();
      return;
    }

    // Base da API dinâmica: localhost em dev, Railway em prod
    const localBase = resolveApiBase();
    const remoteBase = "https://tcc-main.up.railway.app";
    let apiBase = localBase;

    // Primeiro, consultar meta: hasAvatar + etag
    fetch(`${apiBase}/user/me/avatar/meta?ts=${this.avatarTs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          // tenta remoto
          const r2 = await fetch(`${remoteBase}/user/me/avatar/meta?ts=${this.avatarTs}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!r2.ok) throw new Error("avatar-meta-failed");
          apiBase = remoteBase;
          return r2.json();
        }
        return r.json();
      })
      .then((data) => {
        if (!data?.hasAvatar) {
          if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = undefined;
          }
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
        const headers: any = { Authorization: `Bearer ${token}` };
        if (this.avatarEtag) headers["If-None-Match"] = '"' + this.avatarEtag + '"';
        return fetch(`${apiBase}/user/me/avatar?ts=${this.avatarTs}`, { headers, cache: 'no-store' as RequestCache })
          .then(async (resp) => {
            if (resp.status === 304 && this.objectUrl) {
              this.avatarUrl = this.objectUrl;
              this.avatarEtag = data.etag || this.avatarEtag;
              return null;
            }
            if (!resp.ok) {
              const r2 = await fetch(`${remoteBase}/user/me/avatar?ts=${this.avatarTs}`, { headers, cache: 'no-store' as RequestCache });
              if (!r2.ok) throw new Error("avatar-fetch-failed");
              apiBase = remoteBase;
              this.avatarEtag = data.etag || null;
              return r2.blob();
            }
            this.avatarEtag = data.etag || null;
            return resp.blob();
          })
          .then((blob) => {
            if (!blob) return; // 304 ou falha já tratada
            if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = URL.createObjectURL(blob);
            this.avatarUrl = this.objectUrl;
          });
      })
      .catch(async () => {
        // Tentativa base64 (local e remoto)
        const tryBases = async () => {
          for (const base of [apiBase, remoteBase]) {
            try {
              const r = await fetch(`${base}/user/me/avatar/base64?ts=${this.avatarTs}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (r.ok) {
                const data = await r.json();
                if (
                  data?.hasAvatar &&
                  typeof data.base64 === "string" &&
                  this.isValidBase64(data.base64)
                ) {
                  const mime = data.mimeType || "image/png";
                  this.avatarUrl = `data:${mime};base64,${data.base64}`;
                  return true;
                }
              }
            } catch {}
          }
          return false;
        };
        if (await tryBases()) return;
        // Tentativa blob direta (local e remoto)
        for (const base of [apiBase, remoteBase]) {
          try {
            const r2 = await fetch(`${base}/user/me/avatar?ts=${this.avatarTs}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r2.ok) {
              const blob = await r2.blob();
              if (blob && (blob as any).size > 0) {
                if (this.objectUrl) {
                  URL.revokeObjectURL(this.objectUrl);
                  this.objectUrl = undefined;
                }
                this.objectUrl = URL.createObjectURL(blob);
                this.avatarUrl = this.objectUrl;
                return;
              }
            }
          } catch {}
        }
        // Falhou tudo
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
          this.objectUrl = undefined;
        }
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
    alert("Em breve!");
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
