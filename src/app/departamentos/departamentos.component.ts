import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { DepartmentService } from '../services/department.service';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MenuComponent],
  template: `
    <app-menu></app-menu>
    <div class="dep-page">
      <div class="card list-card">
        <div class="header-row">
          <h2>Departamentos</h2>
          <a class="btn-novo" routerLink="/departamentos/novo">+ Novo</a>
        </div>
        <div class="busca-row">
          <input #buscaEl class="busca" type="text" placeholder="Buscar departamento..." [value]="termo" (input)="onBuscar(buscaEl.value)" />
        </div>
        <div *ngIf="loading" class="status">Carregando...</div>
        <div *ngIf="!loading && (!departamentos || departamentos.length === 0)" class="status">Nenhum departamento cadastrado.</div>
        <ul class="lista" *ngIf="!loading && departamentos.length">
          <li *ngFor="let d of departamentos" class="item">
            <ng-container *ngIf="editandoId !== d.id; else edicaoTpl">
              <span class="nome">{{ d.name || d.nome || d.title || d.label || d.departmentName || d.description || '—' }}</span>
              <div class="acoes">
                <button class="btn" (click)="iniciarEdicao(d)">Editar</button>
                <button class="btn danger" (click)="excluir(d)" [disabled]="deletandoId === d.id">{{ deletandoId===d.id ? 'Excluindo...' : 'Excluir' }}</button>
              </div>
            </ng-container>
            <ng-template #edicaoTpl>
              <input class="nome-input" [(ngModel)]="editNome" [disabled]="salvando" />
              <div class="acoes">
                <button class="btn" (click)="salvar(d)" [disabled]="salvando || !editNome">{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
                <button class="btn outline" type="button" (click)="cancelar()" [disabled]="salvando">Cancelar</button>
              </div>
            </ng-template>
          </li>
        </ul>
        <div class="paginacao" *ngIf="!loading && total > pageSize">
          <button class="btn outline" (click)="prevPage()" [disabled]="page===1">Anterior</button>
          <span class="pagina-info">Página {{ page }} de {{ totalPages }} ({{ total }} itens)</span>
          <button class="btn outline" (click)="nextPage()" [disabled]="page===totalPages">Próxima</button>
        </div>
        <div class="mensagens">
          <div *ngIf="erro" class="alert erro">{{ erro }}</div>
          <div *ngIf="sucesso" class="alert sucesso">{{ sucesso }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dep-page { max-width:820px; margin:2.2rem auto; padding:0 1rem; }
    .card { background:#fff; border:1px solid #e0edf3; border-radius:.95rem; box-shadow:0 2px 8px #00000012; padding:1.2rem 1.4rem 1.3rem; }
    .header-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:.8rem; }
    h2 { margin:0; font-size:1.25rem; font-weight:700; background:linear-gradient(90deg,#38b6a5 0%, #4f8cff 100%); -webkit-background-clip:text; color:transparent; letter-spacing:.5px; }
    .btn-novo { background:linear-gradient(90deg,#38b6a5 60%, #4f8cff 100%); color:#fff; text-decoration:none; padding:.55rem .9rem; border-radius:.6rem; font-weight:700; }
  .busca-row { margin: .2rem 0 0.6rem; }
  .busca { width:100%; border:1px solid #d5e4ec; border-radius:.6rem; padding:.5rem .7rem; }
    .lista { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.55rem; }
    .item { display:flex; align-items:center; justify-content:space-between; gap:.8rem; border:1px solid #e8f2f6; padding:.7rem .8rem; border-radius:.7rem; }
    .nome { font-weight:600; color:#173c49; }
    .acoes { display:flex; align-items:center; gap:.5rem; }
    .btn { border:none; background:#eaf6ff; color:#215a6b; padding:.45rem .8rem; border-radius:.6rem; font-weight:700; cursor:pointer; }
    .btn:hover { filter:brightness(0.98); }
    .btn.outline { background:#fff; border:1px solid #cbdfe7; color:#215a6b; }
    .btn.danger { background:#ffe9e9; color:#b33535; }
    .nome-input { flex:1; min-width:160px; border:1px solid #d5e4ec; border-radius:.55rem; padding:.5rem .7rem; }
    .status { padding:.5rem .3rem; color:#4f6b75; }
    .mensagens { margin-top:.8rem; }
  .paginacao { margin-top:.7rem; display:flex; align-items:center; justify-content:space-between; }
  .pagina-info { color:#4f6b75; font-size:.85rem; }
    .alert { width:max-content; padding:.45rem .65rem; border-radius:.55rem; font-size:.75rem; font-weight:700; }
    .alert.erro { background:#ffe9e9; color:#b33535; border:1px solid #ffc5c5; }
    .alert.sucesso { background:#e5fff7; color:#178667; border:1px solid #b9f1e1; }
  `]
})
export class DepartamentosComponent implements OnInit {
  // fonte completa e visão atual (filtrada/paginada)
  private todos: any[] = [];
  departamentos: any[] = [];
  loading = true;
  erro: string | null = null;
  sucesso: string | null = null;
  editandoId: number | null = null;
  editNome = '';
  salvando = false;
  deletandoId: number | null = null;
  // busca e paginação
  termo = '';
  page = 1;
  pageSize = 8;
  total = 0;
  totalPages = 1;

  constructor(private dept: DepartmentService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true; this.erro = null; this.sucesso = null;
    this.dept.getAll().subscribe({
      next: (ds: any[]) => { this.todos = ds || []; this.applyView(); this.loading = false; },
      error: (e: any) => { this.erro = e?.error?.message || 'Erro ao carregar departamentos'; this.loading = false; }
    });
  }

  iniciarEdicao(d: any) {
    this.editandoId = d.id; this.editNome = d.name || d.nome || '';
  }
  cancelar() { this.editandoId = null; this.editNome = ''; }

  salvar(d: any) {
    if (!this.editNome) return;
    this.salvando = true; this.erro = null; this.sucesso = null;
    this.dept.update(d.id, { name: this.editNome }).subscribe({
      next: () => { d.name = this.editNome; this.sucesso = 'Departamento atualizado'; this.cancelar(); },
      error: (e: any) => { this.erro = e?.error?.message || 'Erro ao salvar'; },
      complete: () => { this.salvando = false; }
    });
  }

  excluir(d: any) {
    if (!confirm(`Excluir departamento "${d.name || d.nome}"?`)) return;
    this.deletandoId = d.id; this.erro = null; this.sucesso = null;
    this.dept.remove(d.id).subscribe({
      next: () => { this.todos = this.todos.filter(x => x.id !== d.id); this.applyView(); this.sucesso = 'Departamento excluído'; },
      error: (e: any) => { this.erro = e?.error?.message || 'Erro ao excluir'; },
      complete: () => { this.deletandoId = null; }
    });
  }

  // Busca e paginação
  onBuscar(term: string) { this.termo = term; this.page = 1; this.applyView(); }
  nextPage() { if (this.page < this.totalPages) { this.page++; this.applyView(); } }
  prevPage() { if (this.page > 1) { this.page--; this.applyView(); } }
  setPage(p: number) { if (p >= 1 && p <= this.totalPages) { this.page = p; this.applyView(); } }

  private applyView() {
    const t = (this.termo || '').toLowerCase();
    const filtered = t
      ? this.todos.filter(d => {
          const name = (d.name || d.nome || d.title || d.label || d.departmentName || d.description || '').toString().toLowerCase();
          return name.includes(t);
        })
      : [...this.todos];
    this.total = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;
    const start = (this.page - 1) * this.pageSize;
    this.departamentos = filtered.slice(start, start + this.pageSize);
  }
}
