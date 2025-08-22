import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { MenuComponent } from '../menu/menu.component';
import { LoadingService } from "../services/loading.service";

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
  password: '',
  departmentName: '',
  departmentId: null as number | null
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
  avatarSrc: string | null = null; // object URL da foto carregada
  private avatarObjectUrl?: string;
  private avatarEtag: string | null = null;

  private isValidBase64(s: string): boolean {
    if (!s || typeof s !== 'string') return false;
    const trimmed = s.trim();
    if (trimmed.length === 0 || trimmed.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed);
  }
  editMode = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private loading: LoadingService
  ) {}

  ngOnInit() {
  this.userService.getCurrentUser().subscribe({
      next: (user: any) => {
  this.user.firstName = user.first_Name || user.firstName || '';
  this.user.lastName = user.last_Name || user.lastName || '';
  this.user.email = user.email || '';
  const dept = this.extractDepartment(user);
  this.user.departmentName = dept.name;
  this.user.departmentId = dept.id;
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
        const dept = this.extractDepartment(user);
        this.user.departmentName = dept.name;
        this.user.departmentId = dept.id;
      }
    });
  }

  // Extrai nome e id do departamento independente do formato retornado
  private extractDepartment(user: any): { name: string; id: number | null } {
    const raw = user?.department ?? user?.departamento ?? user?.dept ?? null;
    let name = '';
    let id: number | null = null;
    if (typeof raw === 'string') {
      name = raw;
    } else if (raw && typeof raw === 'object') {
      name = raw.name || raw.nome || raw.title || raw.label || raw.departmentName || raw.description || '';
      if (raw.id != null) {
        const n = Number(raw.id);
        id = isNaN(n) ? null : n;
      }
    }
    if (!name) name = user?.departmentName || user?.department_name || 'Departamento não definido';
    if (id == null) {
      const n2 = user?.departmentId ?? user?.department_id;
      id = (n2 != null && !isNaN(Number(n2))) ? Number(n2) : null;
    }
    return { name: name || 'Departamento não definido', id };
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
    const apiBase = window.location.hostname.includes('localhost')
      ? 'http://localhost:3000'
      : 'http://localhost:3000';
    fetch(`${apiBase}/user/me/avatar`, {
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
    // evita refetch quando já temos versão válida
    const token = localStorage.getItem('token');
    if (!token) return;
    const apiBase = window.location.hostname.includes('localhost')
      ? 'http://localhost:3000'
      : 'http://localhost:3000';
  this.loading.block();
  fetch(`${apiBase}/user/me/avatar/meta?ts=${this.timestamp}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('meta-fail'); return r.json(); })
      .then(meta => {
        if (!meta?.hasAvatar) { this.clearAvatarUrl(); return; }
        if (!force && this.avatarEtag && meta.etag === this.avatarEtag && this.avatarObjectUrl) {
          this.avatarSrc = this.avatarObjectUrl; return;
        }
  const headers: any = { 'Authorization': `Bearer ${token}` };
  if (this.avatarEtag) headers['If-None-Match'] = '"' + this.avatarEtag + '"';
        return fetch(`${apiBase}/user/me/avatar`, { headers })
          .then(resp => {
            if (resp.status === 304 && this.avatarObjectUrl) { this.avatarSrc = this.avatarObjectUrl; this.avatarEtag = meta.etag; return null; }
            if (!resp.ok) throw new Error('avatar-fetch-fail');
            this.avatarEtag = meta.etag || null;
            return resp.blob();
          })
          .then(blob => {
            if (!blob || (blob as any).size === 0) return;
            this.clearAvatarUrl();
            this.avatarObjectUrl = URL.createObjectURL(blob);
            this.avatarSrc = this.avatarObjectUrl;
          });
      })
      .catch(async ()=>{
        // Fallback base64
        try {
          const r = await fetch(`${apiBase}/user/me/avatar/base64?ts=${this.timestamp}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (r.ok) {
            const data = await r.json();
            if (data?.hasAvatar && typeof data.base64 === 'string' && this.isValidBase64(data.base64)) {
              const mime = data.mimeType || 'image/png';
              this.avatarSrc = `data:${mime};base64,${data.base64}`;
              return;
            }
          }
        } catch {}
        // Fallback blob direto
        try {
          const r2 = await fetch(`${apiBase}/user/me/avatar?ts=${this.timestamp}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (r2.ok) {
            const blob = await r2.blob();
            this.clearAvatarUrl();
            this.avatarObjectUrl = URL.createObjectURL(blob);
            this.avatarSrc = this.avatarObjectUrl;
          }
        } catch {}
      })
      .finally(() => this.loading.unblock());
  }

  private clearAvatarUrl() {
    if (this.avatarObjectUrl) { URL.revokeObjectURL(this.avatarObjectUrl); this.avatarObjectUrl = undefined; }
    this.avatarSrc = null;
  }
}
