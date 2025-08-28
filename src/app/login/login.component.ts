import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";
import { MenuComponent } from "../menu/menu.component";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { DiaryService } from '../services/diary.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  email: string = "";
  password: string = "";
  mensagem: string | null = null;
  private errorTimer: any = null;

  constructor(
    private authService: AuthService,
    private diaryService: DiaryService,
    private router: Router
  ) {}

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        localStorage.setItem("token", response.token);
        // Redirecionamento simples sem obrigatoriedade de diário:
        const payload = this.authService.getUserInfoFromToken();
        if (payload?.role === 'support') {
          this.router.navigate(["/empresa"]);
        } else if (payload?.role === 'admin') {
          this.router.navigate(["/dashboard"]);
        } else { // employee e demais
          this.router.navigate(["/pesquisas"]);
        }
      },
      (error) => {
        let msg: string;
        const backendMsg = (error?.error?.message || '').toLowerCase();
        if (error?.status === 0 || (error?.message && /network|fetch|connection/i.test(error.message))) {
          msg = 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.';
        } else if (error?.status === 401) {
          if (backendMsg.includes('usuário não cadastrado') || backendMsg.includes('usuario não cadastrado') || backendMsg.includes('usuario nao cadastrado')) {
            msg = 'E-mail não encontrado. Verifique se digitou corretamente ou Contate um Administrador.';
          } else if (backendMsg.includes('senha incorreta')) {
            msg = 'Senha incorreta.';
          } else {
            msg = 'Credenciais inválidas.';
          }
        } else if (error?.status === 403) {
          msg = 'Acesso não autorizado.';
        } else {
          msg = (error?.error?.message) || 'Falha ao autenticar.';
        }
        this.setError(msg);
      }
    );
  }

  dismissError() { this.mensagem = null; }
  private setError(msg: string) {
    this.mensagem = msg;
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(()=> { this.mensagem = null; this.errorTimer = null; }, 2500);
  }
}
