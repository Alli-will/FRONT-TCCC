import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SearchService } from '../services/search.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-relatorios-pesquisas',
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent],
  template: `
    <app-menu></app-menu>
    <div class="relatorios-page">
      <div class="header">
        <h2>Resultados por pesquisa</h2>
      </div>
      <div *ngIf="erro" class="erro">{{ erro }}</div>
      <div *ngIf="loading && !erro" class="loading">Carregando relatórios...</div>
      <div class="lista-wrapper" *ngIf="!erro && !loading">
        <table class="tbl" *ngIf="pesquisas.length; else vazioTpl">
          <thead>
            <tr>
              <th style="width:40px;" class="center">#</th>
              <th>Título</th>
              <th style="width:110px;" class="center">Tipo</th>
              <th style="width:110px;" class="center">Respondentes</th>
              <th style="width:120px;" class="center">Data</th>
              <th style="width:130px;" class="center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pesquisas; let i = index">
              <td class="center">{{ (page-1)*pageSize + i + 1 }}</td>
              <td class="titulo-cell">{{ p.titulo }}</td>
              <td class="center"><span class="pill" [class.pulso]="p.tipo==='pulso'" [class.clima]="p.tipo==='clima'">{{ p.tipo }}</span></td>
              <td class="center resp-cell">{{ p.respondentes ?? '-' }}</td>
              <td class="center data-cell">{{ formatDate(p.createdAt) }}</td>
              <td class="center">
                <a class="acao" [routerLink]="['/relatorio-pesquisa', p.id]">Ver Relatório</a>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #vazioTpl>
          <div class="vazio">Nenhuma pesquisa encontrada.</div>
        </ng-template>
        <div class="paginacao" *ngIf="totalPages>1">
          <button (click)="mudarPagina(-1)" [disabled]="page===1">«</button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button (click)="mudarPagina(1)" [disabled]="page===totalPages">»</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
  .relatorios-page { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; }
  .loading { padding:1rem; font-size:.8rem; color:#2d5b66; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.4rem; }
    h2 { margin:0; font-size:1.55rem; font-weight:700; }
  .voltar { text-decoration:none; }
    .erro { background:#ffe9e9; border:1px solid #ffc5c5; color:#d93030; padding:.75rem .95rem; border-radius:.7rem; font-size:.8rem; margin-bottom:1rem; }
    .tbl { width:100%; border-collapse:collapse; background:#fff; border:1px solid #e0edf3; box-shadow:0 2px 6px #0000000d; }
  .tbl th { text-align:left; padding:.6rem .75rem; font-size:.68rem; letter-spacing:.5px; text-transform:uppercase; background:#f5f9fa; }
  .tbl td { padding:.55rem .75rem; font-size:.8rem; border-top:1px solid #eef3f5; vertical-align:middle; }
  .tbl th.center, .tbl td.center { text-align:center; }
  .titulo-cell { white-space:nowrap; }
  .data-cell { font-size:.72rem; color:#41545d; }
    .pill { text-transform:uppercase; font-size:.6rem; letter-spacing:.5px; font-weight:700; padding:.3rem .55rem; border-radius:.6rem; background:#e2eef2; color:#2d3a41; }
    .pill.pulso { background:#e1faf5; color:#1c7e72; }
    .pill.clima { background:#e7f0ff; color:#2b5fa8; }
    .acao { text-decoration:none; background:#4f8cff; color:#fff; padding:.4rem .65rem; border-radius:.5rem; font-size:.7rem; font-weight:600; display:inline-block; }
    .paginacao { margin-top:1rem; display:flex; align-items:center; gap:.8rem; font-size:.75rem; }
    .paginacao button { background:#fff; border:1px solid #c9dbe2; padding:.35rem .65rem; border-radius:.4rem; cursor:pointer; }
    .paginacao button:disabled { opacity:.5; cursor:default; }
    .vazio { padding:1.2rem; text-align:center; font-size:.8rem; color:#546974; }
  `]
})
export class RelatoriosPesquisasComponent {
  pesquisas: any[] = [];
  erro = '';
  page = 1;
  totalPages = 1;
  pageSize = 20;
  loading = true;
  constructor(private searchService: SearchService) {}
  ngOnInit() { this.carregar(); }
  carregar() {
    this.loading = true;
    this.searchService.getAllSearches(this.page, this.pageSize, true).subscribe({
      next: (res: any) => {
        if (res?.items) { this.pesquisas = res.items; this.totalPages = res.meta?.totalPages || 1; }
        else this.pesquisas = res;
        this.loading = false;
      },
      error: () => { this.erro = 'Erro ao carregar pesquisas.'; this.loading = false; }
    });
  }
  mudarPagina(delta: number) {
    const nova = this.page + delta;
    if (nova < 1 || nova > this.totalPages) return;
    this.page = nova; this.carregar();
  }
  formatDate(d: any) {
    if (!d) return '-';
    try { const dt = new Date(d); return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR'); } catch { return '-'; }
  }
}
