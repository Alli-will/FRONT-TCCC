import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-perfil",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./perfil.component.html",
  styleUrls: ["./perfil.component.css"],
})
export class PerfilComponent implements OnInit {
  user: any = {
    firstName: "",
    lastName: "",
    email: "",
    // outros campos se necessário
  };

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const payload = this.authService.getUserInfoFromToken();
    if (payload?.email) {
      this.userService.getUserByEmail(payload.email).subscribe((user: any) => {
        // Ajuste para compatibilizar campos do backend
        this.user = {
          firstName: user.first_Name || user.firstName || "",
          lastName: user.last_Name || user.lastName || "",
          email: user.email || "",
          // outros campos se necessário
        };
      });
    }
  }

  onSubmit() {
    // Atualizar dados do usuário (implementar endpoint no backend se necessário)
    const userPayload = {
      first_Name: this.user.firstName,
      last_Name: this.user.lastName,
      email: this.user.email,
      // outros campos se necessário
    };
    this.userService.updateUser(userPayload).subscribe(
      (response) => {
        alert("Dados atualizados com sucesso!");
      },
      (error) => {
        alert("Erro ao atualizar dados.");
      }
    );
  }
}
