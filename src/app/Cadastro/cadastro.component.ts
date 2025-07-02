import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-cadastro",
  standalone: true,
  templateUrl: "./cadastro.component.html",
  styleUrls: ["./cadastro.component.css"],
  imports: [FormsModule, CommonModule],
})
export class CadastroComponent {
  user = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyId: 1,
  };
  errorMessage: string | null = null;

  constructor(private userService: UserService, private router: Router) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cadastroUser = localStorage.getItem("cadastroUser");
      if (cadastroUser) {
        this.user = { ...this.user, ...JSON.parse(cadastroUser) };
        localStorage.removeItem("cadastroUser");
      }
    }
  }

  onSubmit() {
    this.errorMessage = null;
    const userPayload = {
      first_Name: this.user.firstName,
      last_Name: this.user.lastName,
      email: this.user.email,
      password: this.user.password,
      companyId: this.user.companyId,
    };
    this.userService.createUser(userPayload).subscribe(
      (response) => {
        if (typeof window !== 'undefined') {
          alert("Usuário cadastrado com sucesso!");
        }
        this.router.navigate(["/login"]);
      },
      (error) => {
       
        let msg = "Erro ao cadastrar. Tente novamente.";
        if (error?.error?.details) {
          if (Array.isArray(error.error.details)) {
            msg = error.error.details.join(' ');
          } else {
            msg = error.error.details;
          }
        } else if (error?.error?.message) {
          if (Array.isArray(error.error.message)) {
            msg = error.error.message.join(' ');
          } else {
            msg = error.error.message;
          }
        } else if (error?.error?.error) {
          msg = error.error.error;
        }
        this.errorMessage = msg;
        if (typeof window !== 'undefined') {
          alert(msg);
        }
      }
    );
  }

  voltar() {
    this.router.navigate(["/login"]);
  }
}
