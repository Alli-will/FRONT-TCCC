import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
	constructor(private auth: AuthService, private router: Router) {}
	canActivate(): boolean {
		const info = this.auth.getUserInfoFromToken();
		if (info?.role === 'admin') return true;
		// Redireciona usuários não-admin
		this.router.navigate(['/dashboard']);
		return false;
	}
}
