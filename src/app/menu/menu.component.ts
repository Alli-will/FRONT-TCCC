import { Component, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIf, NgClass } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [RouterLink, NgIf, NgClass],
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.css"],
})
export class MenuComponent implements OnInit {
  isLoggedIn = false;
  dropdownOpen: boolean = false;
  sidebarOpen: boolean = window.innerWidth > 900; // Sidebar sempre expandido em telas grandes
  userName: string | null = null;
  userEmail: string | null = null;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.sidebarOpen = window.innerWidth > 900;
    });
    this.authService.currentUser.subscribe((token) => {
      this.isLoggedIn = !!token;
      if (token) {
        const payload = this.authService.getUserInfoFromToken();
        this.isAdmin = payload?.role === 'admin';
        this.userName = (payload?.first_Name && payload?.last_Name)
          ? `${payload.first_Name} ${payload.last_Name}`
          : payload?.first_Name || payload?.last_Name || payload?.email || null;
        this.userEmail = payload?.email || null;
      } else {
        this.userName = null;
        this.userEmail = null;
        this.isAdmin = false;
      }
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
  logout() {
    this.authService.logout();
  }

  preencherCadastroComUsuarioLogado() {
    const payload = this.authService.getUserInfoFromToken();
    if (payload) {
      // Preenche localStorage diretamente com dados do payload
      localStorage.setItem(
        "cadastroUser",
        JSON.stringify({
          firstName: payload.first_Name || payload.firstName || "",
          lastName: payload.last_Name || payload.lastName || "",
          email: payload.email || "",
          password: "", // nunca preenche senha
          companyId: payload.companyId || 1,
        })
      );
    }
  }

  showComingSoon() {
    alert('Em breve!');
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  get isMobileScreen(): boolean {
    return window.innerWidth <= 900;
  }
}
