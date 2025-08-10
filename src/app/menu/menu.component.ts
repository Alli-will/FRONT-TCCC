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
  isSupport = false;
  isEmployee = false;
  avatarUrl: string | null = null; // agora endpoint dinâmico
  private avatarTs: number = Date.now();
  private objectUrl?: string;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.sidebarOpen = window.innerWidth > 900;
    });
    // ouvir evento de atualização do avatar
    window.addEventListener('avatar-updated', (e: any) => {
      this.avatarTs = e?.detail?.ts || Date.now();
      this.refreshAvatar();
    });

    this.authService.currentUser.subscribe((token) => {
      this.isLoggedIn = !!token;
      if (token) {
        const payload = this.authService.getUserInfoFromToken();
        this.isAdmin = payload?.role === 'admin';
  this.isSupport = payload?.role === 'support';
  this.isEmployee = payload?.role === 'employee';
        this.userName = (payload?.first_Name && payload?.last_Name)
          ? `${payload.first_Name} ${payload.last_Name}`
          : payload?.first_Name || payload?.last_Name || payload?.email || null;
        this.userEmail = payload?.email || null;
        this.refreshAvatar();
      } else {
        this.userName = null;
        this.userEmail = null;
        this.isAdmin = false;
  this.isSupport = false;
  this.isEmployee = false;
        this.avatarUrl = null;
      }
    });
  }

  private refreshAvatar() {
    if (!this.isLoggedIn) {
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.avatarUrl = null;
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`http://localhost:3000/user/me/avatar?${this.avatarTs}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(async r => {
      if (!r.ok) throw new Error('no avatar');
      const blob = await r.blob();
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = URL.createObjectURL(blob);
      this.avatarUrl = this.objectUrl;
    }).catch(()=>{
      // sem avatar: mantém null
      this.avatarUrl = null;
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
      localStorage.setItem(
        "cadastroUser",
        JSON.stringify({
          firstName: payload.first_Name || payload.firstName || "",
          lastName: payload.last_Name || payload.lastName || "",
          email: payload.email || "",
          password: "", 
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
