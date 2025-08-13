import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-departamento-novo',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent],
  template: `
    <app-menu></app-menu>
    <div class="dep-page">
      <div class="card form-card">
        <div class="card-header">
          <h2>Cadastro Departamento</h2>
        </div>
        <form (ngSubmit)="criar()" #f="ngForm" class="dep-form">
          <div class="field">
            <label for="dep-nome">Nome *</label>
            <input id="dep-nome" name="name" [(ngModel)]="name" required placeholder="Ex: Marketing" />
          </div>
          <div class="actions">
            <button type="button" class="btn-sec" (click)="voltar()" [disabled]="loading">Voltar</button>
            <button type="submit" [disabled]="loading || !name">
              <span *ngIf="!loading">Criar</span>
              <span *ngIf="loading" class="loader"></span>
            </button>
          </div>
        </form>
        <div class="mensagens">
          <div *ngIf="error" class="alert erro">{{ error }}</div>
          <div *ngIf="success" class="alert sucesso">{{ success }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dep-page { max-width:640px; margin:2.2rem auto; padding:0 1rem; }
    .card { background:#fff; border:1px solid #e0edf3; border-radius:.95rem; box-shadow:0 2px 8px #00000012; padding:1.55rem 1.7rem 1.8rem; display:flex; flex-direction:column; gap:1.3rem; }
    .card-header h2 { margin:0; font-size:1.25rem; font-weight:700; background:linear-gradient(90deg,#38b6a5 0%, #4f8cff 100%); -webkit-background-clip:text; color:transparent; letter-spacing:.5px; }
    form.dep-form { display:flex; flex-direction:column; gap:1.15rem; }
    .field { display:flex; flex-direction:column; gap:.45rem; }
    .field label { font-size:.65rem; text-transform:uppercase; letter-spacing:.55px; font-weight:700; color:#4a5b63; }
    .field input { border:1px solid #d5e4ec; border-radius:.75rem; background:#f9fbfc; padding:.7rem .9rem; font-size:.9rem; outline:none; transition:border .2s, background .2s, box-shadow .2s; }
    .field input:focus { border-color:#38b6a5; background:#fff; box-shadow:0 0 0 3px #38b6a514; }
    .actions { display:flex; justify-content:flex-end; gap:.7rem; }
    .actions button { min-width:130px; border:none; border-radius:.8rem; cursor:pointer; font-weight:600; font-size:.8rem; letter-spacing:.5px; padding:.75rem 1.1rem; display:flex; align-items:center; justify-content:center; gap:.5rem; transition:filter .2s, transform .15s; }
    .actions button:not(:disabled):hover { filter:brightness(1.05); }
    .actions button:not(:disabled):active { transform:translateY(1px); }
    .actions button:disabled { opacity:.55; cursor:not-allowed; }
    .actions button[type=submit] { background:linear-gradient(90deg,#38b6a5 60%, #4f8cff 100%); color:#fff; box-shadow:0 2px 8px rgba(56,182,165,.25); }
    .actions .btn-sec { background:#fff; border:1px solid #c9dbe2; color:#2c6b74; }
    .actions .btn-sec:hover:not(:disabled) { background:#f4f9fa; }
    .loader { width:18px; height:18px; border:2px solid rgba(255,255,255,.45); border-top-color:#fff; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg);} }
    .mensagens { display:flex; flex-direction:column; gap:.6rem; }
    .alert { width:max-content; padding:.55rem .75rem; border-radius:.65rem; font-size:.7rem; font-weight:600; letter-spacing:.3px; }
    .alert.erro { background:#ffe9e9; color:#d93030; border:1px solid #ffc5c5; }
    .alert.sucesso { background:#e5fff7; color:#178667; border:1px solid #b9f1e1; }
  `]
})
export class DepartamentoNovoComponent {
  name = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  criar() {
    if (!this.name) return;
    this.loading = true; this.error = null; this.success = null;
    this.http.post('https://tcc-main.up.railway.app/departments', { name: this.name }).subscribe({
      next: () => { this.success = 'Departamento criado'; this.name=''; },
      error: (err) => { this.error = err?.error?.message || 'Erro ao criar'; },
      complete: () => { this.loading = false; }
    });
  }

  voltar() { this.router.navigate(['/empresa']); }
}
