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
    <div class="dep-container">
      <h2>Novo Departamento</h2>
      <form (ngSubmit)="criar()" #f="ngForm">
        <div class="row">
          <label>Nome*</label>
          <input name="name" [(ngModel)]="name" required />
        </div>
        <button type="submit" [disabled]="loading || !name">{{ loading ? 'Salvando...' : 'Criar' }}</button>
        <button type="button" class="btn-voltar" (click)="voltar()">Voltar</button>
      </form>
      <div *ngIf="error" class="erro">{{ error }}</div>
      <div *ngIf="success" class="sucesso">{{ success }}</div>
    </div>
  `,
  styles: [`
    .dep-container { max-width:480px; margin:2rem auto; background:#fff; padding:1.5rem; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,.1);} 
    .row{display:flex;flex-direction:column;margin-bottom:.75rem;} 
    label{font-weight:600;margin-bottom:.25rem;} 
    input{padding:.5rem;border:1px solid #ccc;border-radius:4px;} 
    button{margin-right:.5rem;background:#1976d2;color:#fff;border:none;padding:.55rem 1rem;border-radius:4px;cursor:pointer;} 
    button[disabled]{opacity:.6;cursor:default;} 
    .btn-voltar{background:#6c6c6c;} 
    .erro{color:#b00020;margin-top:1rem;} 
    .sucesso{color:#1b5e20;margin-top:1rem;} 
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
