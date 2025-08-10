import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-cadastrar-colaborador',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent],
  template: `
    <app-menu></app-menu>
    <div class="cadastro-colaborador-container">
      <div class="top-bar">
        <button type="button" class="btn-voltar" (click)="voltar()" aria-label="Voltar para lista">
          ← Voltar
        </button>
        <h2>Novo Colaborador</h2>
      </div>
      <form (ngSubmit)="submit()" #f="ngForm" novalidate>
        <div class="linha-form" [class.invalido]="!form.first_Name.trim() && tentativa">
          <label>Nome <span>*</span></label>
          <input name="first_Name" [(ngModel)]="form.first_Name" required autocomplete="off" />
        </div>
        <div class="linha-form" [class.invalido]="!form.last_Name.trim() && tentativa">
          <label>Sobrenome <span>*</span></label>
          <input name="last_Name" [(ngModel)]="form.last_Name" required autocomplete="off" />
        </div>
        <div class="linha-form" [class.invalido]="(!form.email.includes('@')) && tentativa">
          <label>Email <span>*</span></label>
          <input name="email" type="email" [(ngModel)]="form.email" required />
        </div>
        <div class="linha-form" [class.invalido]="!form.departmentId && tentativa">
          <label>Departamento <span>*</span></label>
          <select name="departmentId" [(ngModel)]="form.departmentId" required>
            <option value="" disabled selected>Selecione...</option>
            <option *ngFor="let d of departamentos" [value]="d.id">{{ d.nome || d.name }}</option>
          </select>
        </div>
        <div class="linha-form" [class.invalido]="form.password && invalido() && tentativa">
          <label>Senha <span>*</span></label>
          <input name="password" type="password" [(ngModel)]="form.password" minlength="8" required placeholder="Mínimo 8 caracteres" />
          <div class="pw-hints" *ngIf="form.password">
            <span *ngFor="let item of missingPasswordCriteria()" class="hint" [class.ok]="false">{{ item }}</span>
            <span *ngIf="missingPasswordCriteria().length === 0" class="ok-msg">Senha atende aos requisitos.</span>
          </div>
        </div>
        <div class="acoes">
          <button type="submit" class="btn-primario" [disabled]="salvando || invalido()">
            <span *ngIf="!salvando">💾 Salvar</span>
            <span *ngIf="salvando">Salvando...</span>
          </button>
        </div>
        <div *ngIf="sucesso" class="sucesso">Colaborador criado! Redirecionando...</div>
        <div *ngIf="erro" class="erro">{{ erro }}</div>
      </form>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .cadastro-colaborador-container { max-width: 640px; margin: 24px auto; background: #ffffff; padding: 32px 30px 28px; border-radius: 20px; box-shadow: 0 8px 28px -6px rgba(0,0,0,.08); position:relative; }
    h2 { margin:0; font-size:1.55rem; color:#2f2f2f; font-weight:700; }
    .top-bar { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
    .top-bar .btn-voltar { background:transparent; border:none; color:#2d998b; font-weight:600; cursor:pointer; font-size:.9rem; padding:.4rem .6rem; border-radius:8px; transition:background .25s; }
    .top-bar .btn-voltar:hover { background:#e5f7f5; }
    form { display:flex; flex-direction:column; gap:1rem; }
    .linha-form { display:flex; flex-direction:column; position:relative; }
    label { font-weight:600; color:#37474f; margin-bottom:4px; font-size:.9rem; letter-spacing:.3px; }
    label span { color:#e53935; }
  input, select { padding:12px 14px; border:1.5px solid #dfe4e7; border-radius:14px; background:#fafafa; font-size:.95rem; outline:none; transition:border-color .25s, background .25s, box-shadow .25s; }
  input:focus, select:focus { border-color:#38b6a5; background:#fff; box-shadow:0 0 0 3px rgba(56,182,165,.15); }
  .linha-form.invalido input, .linha-form.invalido select { border-color:#e53935; background:#fff5f5; }
  .pw-hints { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
  .hint { background:#fff3e0; border:1px solid #ffe0b2; color:#e65100; font-size:.65rem; padding:4px 8px; border-radius:12px; letter-spacing:.3px; line-height:1; }
  .ok-msg { background:#e8f5e9; border:1px solid #c8e6c9; color:#256029; font-size:.65rem; padding:4px 10px; border-radius:12px; font-weight:600; letter-spacing:.3px; }
    .acoes { display:flex; justify-content:flex-end; margin-top:.5rem; }
    .btn-primario { display:inline-flex; align-items:center; gap:.5rem; background:linear-gradient(135deg,#38b6a5,#2d998b); color:#fff; border:none; padding:.85rem 1.6rem; font-size:.95rem; font-weight:600; letter-spacing:.5px; border-radius:14px; cursor:pointer; box-shadow:0 6px 18px rgba(56,182,165,0.35); position:relative; overflow:hidden; transition:transform .25s, box-shadow .25s; }
    .btn-primario::before { content:''; position:absolute; top:0; left:-35%; width:35%; height:100%; background:rgba(255,255,255,.25); transform:skewX(-25deg); transition:left .55s ease; }
    .btn-primario:hover::before { left:140%; }
    .btn-primario:hover { transform:translateY(-3px); box-shadow:0 10px 22px -4px rgba(56,182,165,0.45); }
    .btn-primario:active { transform:translateY(0); box-shadow:0 6px 14px -4px rgba(56,182,165,0.4); }
    .btn-primario[disabled] { opacity:.55; cursor:not-allowed; transform:none; box-shadow:0 4px 12px rgba(56,182,165,0.25); }
    .sucesso { color:#1b5e20; background:#e8f5e9; padding:.65rem .9rem; border-radius:10px; font-size:.8rem; font-weight:600; animation:fadeIn .4s; }
  .erro { color:#b71c1c; background:#ffebee; padding:.65rem .9rem; border-radius:10px; font-size:.8rem; font-weight:600; animation:fadeIn .4s; white-space:pre-line; line-height:1.25rem; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
    @media (max-width:640px){ .cadastro-colaborador-container { margin:12px 14px; padding:26px 22px 24px; } .acoes { justify-content:stretch; } .btn-primario { flex:1; justify-content:center; } }
  `]
})
export class CadastrarColaboradorComponent {
  form = { first_Name: '', last_Name: '', email: '', password: '', departmentId: '' };
  salvando = false;
  sucesso = false;
  erro: string | null = null;
  tentativa = false;
  departamentos: any[] = [];

  constructor(private userService: UserService, private router: Router) {
    // carregar departamentos
    this.userService.getDepartmentsLocal().subscribe({
      next: (deps) => this.departamentos = deps || [],
      error: () => {}
    });
  }

  invalido() {
    const { first_Name, last_Name, email, password, departmentId } = this.form;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  return !(first_Name.trim() && last_Name.trim() && email.includes('@') && password.length >= 8 && hasLetter && hasDigit && departmentId);
  }

  missingPasswordCriteria(): string[] {
    const p = this.form.password || '';
    const issues: string[] = [];
    if (p.length < 8) issues.push(`Faltam ${8 - p.length} caractere(s)`);
  if (!/[a-zA-Z]/.test(p)) issues.push('Falta uma letra');
    if (!/\d/.test(p)) issues.push('Falta número');
    return issues;
  }

  submit() {
  this.tentativa = true;
  if (this.salvando || this.invalido()) return;
    this.salvando = true;
    this.erro = null;
    this.sucesso = false;
    const payload = { ...this.form, departmentId: Number(this.form.departmentId) } as any;
    if (isNaN(payload.departmentId)) {
      this.erro = 'Departamento inválido';
      this.salvando = false;
      return;
    }
    this.userService.createCollaboratorLocal(payload).subscribe({
      next: () => {
        this.sucesso = true;
        setTimeout(()=> this.router.navigate(['/usuarios']), 1200);
      },
      error: (err) => {
        const raw = err.error?.message;
        if (Array.isArray(raw)) {
          // junta cada motivo em nova linha
            this.erro = raw.map((r: any) => (typeof r === 'string' ? r.trim() : String(r))).filter(Boolean).join('\n');
        } else if (typeof raw === 'string') {
          let txt = raw.trim();
          // heurística: inserir quebra antes de 'A senha' ou 'Senha' quando coladas
          txt = txt.replace(/\s+(A\s+senha)/gi, '\n$1');
          txt = txt.replace(/\s+(Senha\s+deve)/gi, '\n$1');
          this.erro = txt || 'Erro ao criar';
        } else {
          this.erro = 'Erro ao criar';
        }
        this.salvando = false;
      },
      complete: () => this.salvando = false
    });
  }

  voltar() { this.router.navigate(['/usuarios']); }
}
