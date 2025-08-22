import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-empresa-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empresa-usuarios.component.html',
  styleUrls: ['./empresa-usuarios.component.css']
})
export class EmpresaUsuariosComponent implements OnInit {
  isSupport = false;
  role: string | null = null;
  selectedCompany: any = null;
  users: any[] = [];
  loadingUsers = false;
  usersError: string | null = null;
  creatingAdmin = false;
  adminForm: any = { first_Name: '', last_Name: '', email: '', password: '' };
  adminError: string | null = null;
  adminSuccess: string | null = null;

  constructor(private http: HttpClient, private auth: AuthService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const info = this.auth.getUserInfoFromToken();
    this.role = info?.role || null;
    this.isSupport = this.role === 'support';
    if (this.isSupport) {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (!id) { this.router.navigate(['/empresa']); return; }
      this.loadCompany(id);
    }
  }

  loadCompany(id: number) {
    this.http.get(`https://tcc-main.up.railway.app/companies/${id}`).subscribe({
      next: (c:any) => { this.selectedCompany = c; this.loadUsers(); },
      error: () => { this.router.navigate(['/empresa']); }
    });
  }

  loadUsers() {
  if (!this.selectedCompany) return;
    this.loadingUsers = true;
    this.http.get<any[]>(`https://tcc-main.up.railway.app/user?companyId=${this.selectedCompany.id}`).subscribe({
      next: data => { this.users = data || []; },
      error: err => { this.usersError = err?.error?.message || 'Erro ao carregar usuários'; },
      complete: () => { this.loadingUsers = false; }
    });
  }

  toggleAdmin(u: any) {
    const targetRole = u.role === 'admin' ? 'employee' : 'admin';
    this.http.put(`https://tcc-main.up.railway.app/user/${u.id}/role`, { role: targetRole }).subscribe({
      next: (resp: any) => { u.role = resp?.user?.role || targetRole; },
      error: err => alert(err?.error?.message || 'Erro ao alterar role')
    });
  }

  openCreateAdmin() { this.creatingAdmin = true; this.resetAdminForm(); }
  cancelCreateAdmin() { this.creatingAdmin = false; }
  resetAdminForm() { this.adminForm = { first_Name: '', last_Name: '', email: '', password: '' }; this.adminError=null; this.adminSuccess=null; }

  submitCreateAdmin() {
    if (!this.selectedCompany) return;
    this.adminError=null; this.adminSuccess=null;
    const payload = { ...this.adminForm, companyId: this.selectedCompany.id };
    this.http.post('https://tcc-main.up.railway.app/user/register-access', payload).subscribe({
      next: (resp:any) => { this.adminSuccess = 'Administrador criado'; this.loadUsers(); },
      error: err => { this.adminError = err?.error?.details || err?.error?.message || 'Erro'; }
    });
  }

  goBack() { this.router.navigate(['/empresa']); }
}
