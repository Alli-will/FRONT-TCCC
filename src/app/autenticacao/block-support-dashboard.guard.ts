import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class BlockSupportDashboardGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    const info = this.auth.getUserInfoFromToken();
  // Bloqueia apenas o perfil de suporte de acessar a dashboard
    if (info?.role === 'support') {
      this.router.navigate(['/empresa']);
      return false;
    }
    return true;
  }
}
