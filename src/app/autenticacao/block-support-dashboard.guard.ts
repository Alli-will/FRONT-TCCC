import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class BlockSupportDashboardGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    const info = this.auth.getUserInfoFromToken();
    // Bloqueia suporte e colaboradores de acessar a dashboard
    if (info?.role === 'support') {
      this.router.navigate(['/empresa']);
      return false;
    }
    if (info?.role === 'employee') {
      // Envia colaborador para o diário, que agora é sua página inicial
      this.router.navigate(['/diario']);
      return false;
    }
    return true;
  }
}
