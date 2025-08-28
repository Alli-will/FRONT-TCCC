import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-recuperar-senha',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="page-reset">
    <img src="assets/logo_login.png" alt="Logo" class="logo-top" />
    <div class="recuperar-wrapper">
      <div class="top-bar">
  <button type="button" class="btn-primario back-btn" routerLink="/login">← Voltar</button>
      </div>
      <h2 class="gradient-text">Recuperar Senha</h2>
      <form (ngSubmit)="enviar()" *ngIf="!enviado">
        <label>E-mail</label>
        <input [(ngModel)]="email" name="email" type="email" required placeholder="seu@email.com"/>
        <button class="btn-primario" [disabled]="loading">{{ loading ? 'Enviando...' : 'Enviar link' }}</button>
      </form>
  <div class="msg sucesso" *ngIf="enviado">Se o e-mail existir, enviaremos instruções para redefinir a senha.</div>
  <div class="msg erro" *ngIf="erro">{{ erro }}</div>
    </div>
  </div>
  `,
  styles: [`
  .page-reset { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding-top:4rem; background:#ffffff; }
    .logo-top { width:240px; max-width:70%; height:auto; margin:0 0 1.8rem; filter: drop-shadow(0 6px 14px rgba(0,0,0,.12)); }
  .recuperar-wrapper { width:100%; max-width:400px; background:#fffffffa; padding:2.4rem 2.1rem 2.2rem; border-radius:1.25rem; box-shadow:0 8px 30px -6px rgba(0,0,0,.14); display:flex; flex-direction:column; gap:1.1rem; position:relative; border:1px solid #e3f3f4; backdrop-filter: blur(3px); }
    .top-bar { display:flex; align-items:center; justify-content:flex-start; margin-bottom:.1rem; }
  .back-btn { margin-right:auto; padding:.55rem .9rem; font-size:.8rem; }
  .back-btn:before { content:'←'; margin-right:.35rem; font-weight:400; }
    h2 { margin:0 0 .5rem; font-size:1.4rem; font-weight:700; }
    form { display:flex; flex-direction:column; gap:.8rem; }
  label { font-size:.68rem; font-weight:600; letter-spacing:.55px; text-transform:uppercase; color:#276b71; }
  input { border:1px solid #c7e7ec; border-radius:.75rem; padding:.65rem .8rem; font-size:.9rem; background:#f2fbfa; transition:all .18s ease; }
  input:focus { outline:none; border-color:#38b6a5; background:#ffffff; box-shadow:0 0 0 3px rgba(56,182,165,.18); }
  button { background:linear-gradient(100deg,#38b6a5,#429fdc 55%,#4f8cff); color:#fff; border:none; border-radius:.85rem; padding:.7rem .95rem; font-weight:600; cursor:pointer; letter-spacing:.3px; box-shadow:0 3px 10px -3px rgba(63,142,200,.45); transition:filter .18s ease, transform .18s ease; }
    button:disabled { opacity:.6; cursor:default; }
  button:not(:disabled):hover { filter:brightness(.94); }
  button:not(:disabled):active { transform:translateY(1px); }
    .msg { font-size:.8rem; padding:.75rem .9rem; border-radius:.7rem; }
  .sucesso { background:#e6fcf5; color:#166c58; border:1px solid #b6f2e1; }
  .erro { background:#ffe9e9; color:#c42828; border:1px solid #ffc5c5; }
    @media (max-width:650px){
      .page-reset { padding-top:3rem; }
      .logo-top { width:200px; margin-bottom:1.4rem; }
      .recuperar-wrapper { padding:2rem 1.6rem 1.8rem; }
    }
  `]
})
export class RecuperarSenhaComponent {
  email = ''; enviado = false; erro = ''; loading=false;
  constructor(private auth: AuthService) {}
  enviar() {
    if (this.loading) return; this.loading=true; this.erro='';
    this.auth.requestPasswordReset(this.email).subscribe({
      next: () => { this.enviado = true; this.loading=false; },
      error: () => { this.enviado = true; this.loading=false; /* mesmo em erro mostra genérico */ }
    });
  }
}
