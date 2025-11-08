import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: "root" })
export class AdminGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}
  canActivate(): boolean {
    const info = this.auth.getUserInfoFromToken();
    if (info?.role === 'admin') return true;
    // Se não autenticado ou expirado -> login
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { reason: 'auth' } });
      return false;
    }
    // Usuário logado mas não admin: fallback amigável
    this.router.navigate(['/pesquisas'], { queryParams: { denied: 'admin' } });
    return false;
  }
}
