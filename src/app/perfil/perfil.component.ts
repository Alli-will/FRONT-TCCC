import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: "app-perfil",
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent],
  templateUrl: "./perfil.component.html",
  styleUrls: ["./perfil.component.css"],
})
export class PerfilComponent implements OnInit {
  user: any = {
    firstName: "",
    lastName: "",
    email: "",
    password: ''
  };
  carregando = true;
  salvando = false;
  erro: string | null = null;
  sucesso = false;
  // upload avatar (novo fluxo por clique na imagem)
  uploadFile: File | null = null;
  uploadPreview: string | null = null;
  enviandoAvatar = false;
  uploadErro: string | null = null;
  private hiddenInputEl?: HTMLInputElement;
  timestamp: number = Date.now();
  avatarSrc: string | null = null; // object URL/base64 da foto carregada
  editMode = false;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.user.firstName = user.first_Name || user.firstName || '';
        this.user.lastName = user.last_Name || user.lastName || '';
        this.user.email = user.email || '';
  // foto carregada via endpoint /user/me/avatar quando necessário
        this.carregando = false;
  this.carregarAvatar();
      },
      error: () => { this.carregando = false; this.erro = 'Falha ao carregar perfil'; }
    });
  }

  onSubmit() {
  if (this.salvando || !this.editMode) return;
    this.salvando = true; this.sucesso = false; this.erro = null;
    const userPayload: any = {
      first_Name: this.user.firstName,
      last_Name: this.user.lastName,
      email: this.user.email
    };
    if (this.user.password) userPayload.password = this.user.password;
  this.userService.updateCurrentUser(userPayload).subscribe({
      next: () => { this.sucesso = true; this.salvando = false; this.user.password=''; },
      error: (err) => { this.erro = err.error?.message || 'Erro ao atualizar dados.'; this.salvando = false; }
    });
  }

  habilitarEdicao() {
    this.editMode = true;
    this.sucesso = false;
  }

  cancelarEdicao() {
    this.editMode = false;
    this.user.password = '';
    // Recarrega dados do backend para descartar alterações locais
    this.userService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.user.firstName = user.first_Name || user.firstName || '';
        this.user.lastName = user.last_Name || user.lastName || '';
        this.user.email = user.email || '';
      }
    });
  }

  triggerFile() {
    if (!this.hiddenInputEl) {
      this.hiddenInputEl = document.querySelector('input[type=file][hidden]') as HTMLInputElement;
    }
    this.hiddenInputEl?.click();
  }

  onFileChosen(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || !input.files.length) { return; }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { this.uploadErro = 'Arquivo precisa ser imagem'; return; }
    if (file.size > 2 * 1024 * 1024) { this.uploadErro = 'Máx 2MB'; return; }
    this.uploadErro = null;
    this.uploadFile = file;
    this.uploadPreview = URL.createObjectURL(file);
    this.enviarAvatarAutomatico();
  }

  private enviarAvatarAutomatico() {
    if (!this.uploadFile || this.enviandoAvatar) return;
    this.enviandoAvatar = true; this.uploadErro = null;
    const fd = new FormData();
    fd.append('file', this.uploadFile);
    fetch('http://localhost:3000/user/me/avatar', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      body: fd
    }).then(async r => {
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || 'Falha upload');
      }
      return r.json();
    }).then(json => {
  // limpeza pós upload
  this.uploadPreview = null;
  this.uploadFile = null;
      this.timestamp = Date.now();
      try {
        localStorage.setItem('avatarUpdatedTs', this.timestamp.toString());
      } catch {}
      // dispara evento global para outros componentes (menu) recarregarem
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { ts: this.timestamp } }));
      this.carregarAvatar(true);
    }).catch(err => {
      this.uploadErro = err.message || 'Erro ao enviar';
    }).finally(()=> this.enviandoAvatar = false);
  }

  private carregarAvatar(force?: boolean) {
    // evita refetch rápido sem necessidade
    if (!force && this.avatarSrc) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:3000/user/me/avatar?' + this.timestamp, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(async r => {
      if (!r.ok) throw new Error('Sem avatar');
      const blob = await r.blob();
      if (this.avatarSrc) URL.revokeObjectURL(this.avatarSrc);
      this.avatarSrc = URL.createObjectURL(blob);
    }).catch(()=>{
      // silêncio: sem avatar
    });
  }
}
