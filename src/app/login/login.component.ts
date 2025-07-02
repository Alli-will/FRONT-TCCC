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

  constructor(
    private authService: AuthService,
    private diaryService: DiaryService,
    private router: Router
  ) {}

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        localStorage.setItem("token", response.token);
        // Após login, verifica se já fez diário hoje
        this.diaryService.hasEntryToday(response.token).subscribe({
          next: (res) => {
            if (res.hasEntry) {
              this.router.navigate(["/dashboard"]);
            } else {
              this.router.navigate(["/diario"]);
            }
          },
          error: () => {
            // fallback
            this.router.navigate(["/login"]);
          }
        });
      },
      (error) => {
        if (typeof window !== 'undefined') {
          alert("Credenciais inválidas.");
        }
      }
    );
  }
}
