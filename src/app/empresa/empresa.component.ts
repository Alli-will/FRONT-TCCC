import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';

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
  addressZipCode: '',
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
  buscandoCep = false;
  cepErro: string | null = null;
  private errorTimer: any = null;

  constructor(private http: HttpClient, private router: Router, private auth: AuthService, private loadingSvc: LoadingService) {}

  ngOnInit() {
    const info = this.auth.getUserInfoFromToken();
    this.role = info?.role || null;
    this.isSupport = this.role === 'support';
    this.loadingSvc.block();
    if (this.isSupport) {
      this.fetchAllCompanies();
    } else if (info?.companyId) {
      this.loadCompany(info.companyId);
    } else {
      this.companyLoaded = true; // sem company
      this.loadingSvc.unblock();
    }
  }

  private loadCompany(id: number) {
    this.http.get(`https://tcc-main.up.railway.app/companies/${id}`).subscribe({
      next: (data) => { this.companyData = data; this.hasCompany = true; },
      error: () => { /* silencioso */ },
      complete: () => { this.companyLoaded = true; this.loadingSvc.unblock(); }
    });
  }

  private fetchAllCompanies() {
    this.loadingCompanies = true;
    this.http.get<any[]>(`https://tcc-main.up.railway.app/companies`).subscribe({
      next: data => { this.allCompanies = data || []; },
      error: () => {},
      complete: () => { this.loadingCompanies = false; this.companyLoaded = true; this.loadingSvc.unblock(); }
    });
  }

  enviar() {
    this.error = null; this.success = null;
    this.loading = true;
  // Não dispara overlay global; apenas estado local do botão
  const phoneDigits = (this.form.phone || '').toString().replace(/\D/g,'');
  const cnpjDigits = (this.form.cnpj || '').toString().replace(/\D/g,'');
  const zipDigits = (this.form.addressZipCode || '').toString().replace(/\D/g,'');
  // Validações simples no cliente antes de chamar API
  if (cnpjDigits.length !== 14) {
  this.setError('CNPJ inválido');
  this.loading = false;
  return;
  }
  if (!(phoneDigits.length === 10 || phoneDigits.length === 11)) {
  this.setError('Telefone inválido');
  this.loading = false;
  return;
  }
  if (zipDigits.length !== 8) {
  this.setError('CEP inválido');
  this.loading = false;
  return;
  }
  const payload = { ...this.form, phone: phoneDigits, cnpj: cnpjDigits, addressZipCode: zipDigits };
  this.http.post('https://tcc-main.up.railway.app/companies', payload).subscribe({
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
    this.setError(err?.error?.message || 'Erro ao cadastrar empresa');
        this.loading = false; // liberar botão em caso de erro
      },
  complete: () => { this.loading = false; }
    });
  }

  canCreateDepartment(): boolean {
  // Agora somente ADMIN pode cadastrar departamentos (employee oculto)
  return this.role === 'admin';
  }

  navigateToCompanyUsers(c: any) { this.router.navigate(['/empresa/usuarios', c.id]); }

  buscarCep() {
    const raw = (this.form.addressZipCode || '').toString().replace(/\D/g,'');
    this.cepErro = null;
    if (raw.length !== 8) { this.cepErro = 'CEP inválido'; return; }
    this.buscandoCep = true;
    fetch(`https://viacep.com.br/ws/${raw}/json/`)  // ViaCEP API pública
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data?.erro) { this.cepErro = 'CEP não encontrado'; return; }
        // Preenche campos se vierem
        if (data.logradouro) this.form.address = data.logradouro;
        if (data.bairro) this.form.neighborhood = data.bairro;
        if (data.localidade) this.form.municipality = data.localidade;
        if (data.uf) this.form.state = data.uf;
      })
      .catch(()=>{ this.cepErro = 'Falha ao buscar CEP'; })
      .finally(()=> this.buscandoCep = false);
  }

  formatCep() {
    let digits = (this.form.addressZipCode || '').toString().replace(/\D/g,'');
    if (digits.length > 8) digits = digits.substring(0,8);
    if (digits.length >= 6) {
      this.form.addressZipCode = digits.substring(0,5) + '-' + digits.substring(5);
    } else if (digits.length >= 5) {
      this.form.addressZipCode = digits.substring(0,5) + '-' + digits.substring(5);
    } else {
      this.form.addressZipCode = digits;
    }
  }

  formatCnpj() {
    let digits = (this.form.cnpj || '').toString().replace(/\D/g,'');
    if (digits.length > 14) digits = digits.substring(0,14);
    // 00.000.000/0000-00
    let out = digits;
    if (digits.length > 2) out = digits.substring(0,2) + '.' + digits.substring(2);
    if (digits.length > 5) out = out.substring(0,6) + '.' + digits.substring(5);
    if (digits.length > 8) out = out.substring(0,10) + '.' + digits.substring(8);
    if (digits.length > 11) out = out.substring(0,14) + '/' + digits.substring(11);
    if (digits.length > 15) out = out.substring(0,16) + digits.substring(15); // safeguard
    if (digits.length > 12) {
      // Recompute final with proper slashes and dash
      out = digits.substring(0,2) + '.' + digits.substring(2,5) + '.' + digits.substring(5,8) + '/' + digits.substring(8,12) + (digits.length > 12 ? '-' + digits.substring(12) : '');
    }
    this.form.cnpj = out;
  }

  onCnpjKeyDown(e: KeyboardEvent) {
    const controlKeys = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
    if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
    // bloqueia se já tem 14 dígitos e a tecla é dígito
    const digits = (this.form.cnpj || '').toString().replace(/\D/g,'');
    if (digits.length >= 14 && /\d/.test(e.key)) {
      e.preventDefault();
    }
  }

  onCnpjPaste(e: ClipboardEvent) {
    const data = e.clipboardData?.getData('text') || '';
    let digits = data.replace(/\D/g,'');
    if (!digits) return; // deixa cair no fluxo normal
    digits = digits.substring(0,14);
    e.preventDefault();
    this.form.cnpj = digits; // set raw digits first
    this.formatCnpj();
  }

  formatPhone() {
    let digits = (this.form.phone || '').toString().replace(/\D/g,'');
    if (digits.length > 11) digits = digits.substring(0,11); // celular Brasil máximo 11 (DDD+9 dígitos)
    if (digits.length <= 10) {
      // Formato (DD) XXXX-XXXX
      if (digits.length >= 7) {
        this.form.phone = `(${digits.substring(0,2)}) ${digits.substring(2,6)}-${digits.substring(6)}`;
      } else if (digits.length > 2) {
        this.form.phone = `(${digits.substring(0,2)}) ${digits.substring(2)}`;
      } else if (digits.length > 0) {
        this.form.phone = `(${digits}`;
      } else {
        this.form.phone = '';
      }
    } else {
      // Formato (DD) 9XXXX-XXXX
      this.form.phone = `(${digits.substring(0,2)}) ${digits.substring(2,3)}${digits.substring(3,7)}-${digits.substring(7)}`;
    }
  }

  // Máscaras apenas para visualização (dados no banco permanecem sem formatação)
  viewCnpj(raw: string | null | undefined): string {
    const digits = (raw || '').replace(/\D/g,'').substring(0,14);
    if (digits.length !== 14) return raw || '';
    return `${digits.substring(0,2)}.${digits.substring(2,5)}.${digits.substring(5,8)}/${digits.substring(8,12)}-${digits.substring(12)}`;
  }

  viewPhone(raw: string | null | undefined): string {
    const digits = (raw || '').replace(/\D/g,'');
    if (digits.length === 10) {
      // (DD) XXXX-XXXX
      return `(${digits.substring(0,2)}) ${digits.substring(2,6)}-${digits.substring(6)}`;
    }
    if (digits.length === 11) {
      // (DD) 9XXXX-XXXX
      return `(${digits.substring(0,2)}) ${digits.substring(2,3)}${digits.substring(3,7)}-${digits.substring(7)}`;
    }
    if (digits.length >= 2 && digits.length < 10) {
      return `(${digits.substring(0,2)}) ${digits.substring(2)}`;
    }
    return raw || '';
  }

  dismissError() { this.error = null; }

  private setError(msg: string) {
    this.error = msg;
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
    this.errorTimer = setTimeout(() => {
      this.error = null;
      this.errorTimer = null;
    }, 2000); // 2 segundos
  }

}
