import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
  standalone: true,
  selector: "app-definir-nova-senha",
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-reset">
      <img src="assets/logo_login.png" alt="Logo" class="logo-top" />
      <div class="reset-wrapper" *ngIf="!finalizado">
        <h2 class="gradient-text">Nova Senha</h2>
        <form (ngSubmit)="salvar()">
          <label>Nova Senha</label>
          <input
            [(ngModel)]="senha"
            name="senha"
            type="password"
            required
            minlength="6"
            placeholder="••••••"
          />
          <label>Confirmar Senha</label>
          <input
            [(ngModel)]="confirm"
            name="confirm"
            type="password"
            required
            minlength="6"
            placeholder="••••••"
          />
          <button class="btn-primario" [disabled]="loading">
            {{ loading ? "Salvando..." : "Salvar" }}
          </button>
        </form>
        <div class="msg erro" *ngIf="erro">{{ erro }}</div>
      </div>
      <div class="reset-wrapper" *ngIf="finalizado">
        <div class="msg sucesso">Senha redefinida com sucesso. Faça login novamente.</div>
        <a routerLink="/login" class="btn-primario link-login">Ir para Login</a>
      </div>
    </div>
  `,
  styles: [
    `
      .page-reset {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding-top: 4rem;
        background: linear-gradient(135deg, #f4fafc, #eef6ff);
      }
      .logo-top {
        width: 240px;
        max-width: 70%;
        height: auto;
        margin: 0 0 1.8rem;
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.12));
      }
      .reset-wrapper {
        width: 100%;
        max-width: 400px;
        background: #fffffffa;
        padding: 2.4rem 2.1rem 2.2rem;
        border-radius: 1.25rem;
        box-shadow: 0 8px 30px -6px rgba(0, 0, 0, 0.14);
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
        border: 1px solid #e3f3f4;
        backdrop-filter: blur(3px);
      }
      /* back button removido */
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.4rem;
        font-weight: 700;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }
      label {
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: #2d5b66;
      }
      input {
        border: 1px solid #c7e7ec;
        border-radius: 0.75rem;
        padding: 0.65rem 0.8rem;
        font-size: 0.9rem;
        background: #f2fbfa;
        transition: all 0.18s ease;
      }
      input:focus {
        outline: none;
        border-color: #38b6a5;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(56, 182, 165, 0.18);
      }
      button {
        background: linear-gradient(100deg, #38b6a5, #429fdc 55%, #4f8cff);
        color: #fff;
        border: none;
        border-radius: 0.85rem;
        padding: 0.7rem 0.95rem;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.3px;
        box-shadow: 0 3px 10px -3px rgba(63, 142, 200, 0.45);
        transition:
          filter 0.18s ease,
          transform 0.18s ease;
      }
      button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      button:not(:disabled):hover {
        filter: brightness(0.94);
      }
      button:not(:disabled):active {
        transform: translateY(1px);
      }
      .msg {
        font-size: 0.8rem;
        padding: 0.75rem 0.9rem;
        border-radius: 0.7rem;
      }
      .sucesso {
        background: #e6fcf5;
        color: #166c58;
        border: 1px solid #b6f2e1;
      }
      .erro {
        background: #ffe9e9;
        color: #c42828;
        border: 1px solid #ffc5c5;
      }
      .link-login {
        text-decoration: none;
        display: inline-block;
        padding: 0.7rem 1rem;
        margin-top: 0.5rem;
        border-radius: 0.8rem;
      }
      @media (max-width: 650px) {
        .page-reset {
          padding-top: 3rem;
        }
        .logo-top {
          width: 200px;
          margin-bottom: 1.4rem;
        }
        .reset-wrapper {
          padding: 2rem 1.6rem 1.8rem;
        }
      }
    `,
  ],
})
export class DefinirNovaSenhaComponent {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  senha = "";
  confirm = "";
  erro = "";
  loading = false;
  finalizado = false;
  token = this.route.snapshot.paramMap.get("token") || "";
  salvar() {
    if (this.senha !== this.confirm) {
      this.erro = "Senhas não conferem.";
      return;
    }
    if (this.loading) return;
    this.erro = "";
    this.loading = true;
    this.auth.resetPassword(this.token, this.senha).subscribe({
      next: () => {
        this.finalizado = true;
        this.loading = false;
      },
      error: () => {
        this.erro = "Token inválido ou expirado.";
        this.loading = false;
      },
    });
  }
}
