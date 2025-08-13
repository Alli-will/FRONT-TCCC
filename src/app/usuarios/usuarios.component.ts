import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [MenuComponent, CommonModule, RouterModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  colaboradoresAtivos: any[] = [];
  loading = true;
  erro: string | null = null;
  private avatarObjectUrls: string[] = [];

  isAdmin = false;
  departamentos: any[] = [];
  editandoId: number | null = null;
  salvandoDept = false;

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit() {
  this.isAdmin = this.authService.isAdmin();
  if (this.isAdmin) {
    this.userService.getDepartmentsLocal().subscribe({
      next: d => this.departamentos = d || [],
      error: () => {}
    });
  }
  this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.colaboradoresAtivos = (users || [])
          .filter((u: any) => u.ativo !== false && u.role !== 'support')
          .map((u: any) => ({
            id: u.id || u.userId || u.ID || null,
            first_Name: u.first_Name,
            last_Name: u.last_Name,
            nomeCompleto: (u.first_Name || '') + ' ' + (u.last_Name || ''),
            departamento: u.departamento || u.department || 'Departamento não definido',
            avatarUrl: null
          }));
        this.loading = false;
        this.carregarAvatares();
      },
      error: (err) => {
        this.erro = 'Erro ao carregar colaboradores.';
        this.loading = false;
      }
    });
  }

  private carregarAvatares() {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.colaboradoresAtivos.forEach(c => {
      if (!c.id) return; // sem id não busca
      // tenta primeiro local
      const urlLocal = `https://tcc-main.up.railway.app/user/${c.id}/avatar?ts=${Date.now()}`;
      fetch(urlLocal, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(async r => {
          if (!r.ok) throw new Error('no avatar');
          const blob = await r.blob();
          if (!blob || blob.size === 0) throw new Error('empty');
          const objUrl = URL.createObjectURL(blob);
            c.avatarUrl = objUrl;
            this.avatarObjectUrls.push(objUrl);
        })
        .catch(() => {
          // fallback remoto
          const remote = `https://tcc-main.up.railway.app/user/${c.id}/avatar?ts=${Date.now()}`;
          fetch(remote, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async r2 => {
              if (!r2.ok) return;
              const blob2 = await r2.blob();
              if (!blob2 || blob2.size === 0) return;
              const objUrl2 = URL.createObjectURL(blob2);
              c.avatarUrl = objUrl2;
              this.avatarObjectUrls.push(objUrl2);
            }).catch(()=>{});
        });
    });
  }

  ngOnDestroy(): void {
    this.avatarObjectUrls.forEach(u => URL.revokeObjectURL(u));
  }

  iniciarEdicao(c: any) {
    if (!this.isAdmin) return;
    this.editandoId = c.id;
  }

  cancelarEdicao() {
    this.editandoId = null;
  }

  salvarDepartamento(c: any, novoDeptId: string) {
    if (!this.isAdmin) return;
    const deptId = novoDeptId ? Number(novoDeptId) : null;
    this.salvandoDept = true;
    fetch(`https://tcc-main.up.railway.app/user/${c.id}/department`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ departmentId: deptId })
    }).then(r => r.json())
      .then(resp => {
        if (resp?.user) {
          c.departamento = resp.user.department || 'Departamento não definido';
          c.departmentId = resp.user.departmentId;
        }
        this.editandoId = null;
      })
      .catch(()=>{})
      .finally(()=>{ this.salvandoDept = false; });
  }

}
