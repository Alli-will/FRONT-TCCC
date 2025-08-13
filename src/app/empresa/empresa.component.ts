import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent, RouterLink],
  templateUrl: './empresa.component.html',
  styleUrls: ['./empresa.component.css']
})
export class EmpresaComponent implements OnInit {
  form: any = {
    name: '',
    cnpj: '',
    address: '',
    addressZipCode: null,
    neighborhood: '',
    municipality: '',
    state: '',
    country: 'Brasil',
    phone: null
  };
  loading = false;
  error: string | null = null;
  success: string | null = null;
  companyLoaded = false;
  hasCompany = false;
  companyData: any = null;
  role: string | null = null;
  isSupport = false;
  allCompanies: any[] = [];
  loadingCompanies = false;
  showCreateForSupport = false;

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const info = this.auth.getUserInfoFromToken();
    this.role = info?.role || null;
    this.isSupport = this.role === 'support';
    if (this.isSupport) {
      this.fetchAllCompanies();
    } else if (info?.companyId) {
      this.loadCompany(info.companyId);
    } else {
      this.companyLoaded = true; // suporte sem company cai aqui se fetchAllCompanies já tratou
    }
  }

  private loadCompany(id: number) {
    this.http.get(`https://tcc-main.up.railway.app/companies/${id}`).subscribe({
      next: (data) => { this.companyData = data; this.hasCompany = true; },
      error: () => { /* silencioso */ },
      complete: () => { this.companyLoaded = true; }
    });
  }

  private fetchAllCompanies() {
    this.loadingCompanies = true;
    this.http.get<any[]>(`https://tcc-main.up.railway.app/companies`).subscribe({
      next: data => { this.allCompanies = data || []; },
      error: () => {},
      complete: () => { this.loadingCompanies = false; this.companyLoaded = true; }
    });
  }

  enviar() {
    this.error = null; this.success = null;
    this.loading = true;
    this.http.post('https://tcc-main.up.railway.app/companies', this.form).subscribe({
      next: (resp: any) => {
        this.success = 'Empresa cadastrada com sucesso!';
        if (this.isSupport) {
          // atualizar lista
            this.fetchAllCompanies();
            this.showCreateForSupport = false;
        } else {
          this.companyData = resp;
          this.hasCompany = true;
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao cadastrar empresa';
      },
      complete: () => this.loading = false
    });
  }

  canCreateDepartment(): boolean {
  // Agora somente ADMIN pode cadastrar departamentos (employee oculto)
  return this.role === 'admin';
  }

}
