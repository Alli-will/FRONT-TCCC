import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search.service';
import { DepartmentService } from '../services/department.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-relatorio-pesquisa',
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent, FormsModule],
  template: `
    <app-menu></app-menu>
    <div class="relatorio-page" *ngIf="loaded; else loadingTpl">
      <div class="header">
        <h2>Relatório da Pesquisa</h2>
        <a routerLink="/pesquisas" class="voltar">Voltar</a>
      </div>
      <div *ngIf="erro" class="erro">{{ erro }}</div>
      <ng-container *ngIf="!erro">
        <div class="meta">
          <div class="meta-left">
            <h3>{{ report?.titulo }}</h3>
            <div class="data" *ngIf="report?.createdAt">Data: {{ formatDate(report.createdAt) }}</div>
            <div class="pill" [class.pulso]="report?.tipo==='pulso'" [class.clima]="report?.tipo==='clima'">{{ report?.tipo }}</div>
            <div class="resumo">Respondentes: <strong>{{ report?.totalRespondentes }}</strong></div>
          </div>
          <div class="meta-right" *ngIf="departments.length">
            <div class="setor-filter">
              <label class="lbl">Setor</label>
              <div class="select-wrapper">
                <select [(ngModel)]="selectedDepartmentId" (change)="reload()">
                  <option [ngValue]="undefined">Todos os Setores</option>
                  <option *ngFor="let d of departments" [ngValue]="d.id">{{ d.name }}</option>
                </select>
                <span class="icon">▾</span>
              </div>
              <div *ngIf="selectedDepartmentId" class="chip" (click)="clearDept()">
                {{ currentDepartmentName() }} <span class="x">×</span>
              </div>
            </div>
          </div>
        </div>
  <div *ngIf="report?.tipo==='pulso' && report?.nps !== null" class="nps-block">
          <div class="nps-card">
            <div class="nps-value">NPS (1ª pergunta): <span [style.color]="getNpsColor(report?.nps)">{{ report?.nps }}</span></div>
            <div class="metodo-hint">usa somente a primeira pergunta. Cada usuário conta uma vez. Promotores 9-10, Neutros 7-8, Detratores 0-6. NPS = (%Promotores - %Detratores). Distribuição: notas da 1ª pergunta.</div>
            <div class="nps-bars">
              <!-- Ordem invertida: primeiro Detratores, depois Neutros, depois Promotores -->
              <div class="bar detratores" [style.width]="pct(report?.detratores)" title="Detratores">Detratores {{ pct(report?.detratores) }}</div>
              <div class="bar neutros" [style.width]="pct(report?.neutros)" title="Neutros" [ngStyle]="{background:'#fbc02d',color:'#3d3d3d', textShadow:'none', border: pct(report?.neutros)==='0%' ? '1px dashed #fbc02d' : 'none'}">Neutros {{ pct(report?.neutros) }}</div>
              <div class="bar promotores" [style.width]="pct(report?.promotores)" title="Promotores">Promotores {{ pct(report?.promotores) }}</div>
            </div>
            <div class="dist-nps">
              <div *ngFor="let k of npsKeys()" class="nps-col">
                <span class="nps-label">{{ k }}</span>
                <span class="nps-count" [class.zero]="report?.npsDistribuicao[k]?.count===0">{{ report?.npsDistribuicao[k]?.count }}</span>
                <span class="nps-percent" [class.zero]="report?.npsDistribuicao[k]?.percent===0">{{ formatPercent(report?.npsDistribuicao[k]?.percent) }}</span>
              </div>
            </div>
          </div>
        </div>
        <h4>Perguntas</h4>
        <table class="tbl-perguntas" *ngIf="report?.perguntas?.length">
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>Pergunta</th>
              <th style="width:90px;">Média</th>
              <th>Distribuição</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of report.perguntas">
              <td>{{ p.index + 1 }}</td>
              <td>{{ p.texto }}</td>
              <td>{{ p.media !== null ? p.media : '-' }}</td>
              <td>
                <div class="dist-row">
                  <div *ngFor="let item of distEntries(p.distribuicao)" class="dist-seg" [style.flex]="item.count" [title]="item.key + ': ' + item.percent + '%'">
                    <span>{{ item.key }} ({{ item.percent }}%)</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!report?.perguntas?.length">Sem perguntas.</div>
      </ng-container>
    </div>
    <ng-template #loadingTpl>
      <app-menu></app-menu>
      <div class="relatorio-page">Carregando relatório...</div>
    </ng-template>
  `,
  styles: [`
    .relatorio-page { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; }
    h2 { margin:0; font-size:1.6rem; font-weight:700; }
    .voltar { text-decoration:none; background:#fff; border:1px solid #d5e4ec; padding:.5rem .9rem; border-radius:.6rem; font-weight:600; color:#276b7a; }
  .meta { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; margin-bottom:1.2rem; background:linear-gradient(90deg,#f7fafb,#f0f6f8); padding:1rem 1.1rem; border:1px solid #e1ebef; border-radius:.9rem; }
  .meta-left { display:flex; align-items:center; gap:.8rem; flex-wrap:wrap; }
  .meta-right { display:flex; align-items:center; }
    .meta h3 { margin:0; font-size:1.2rem; font-weight:600; }
    .pill { text-transform:uppercase; letter-spacing:.5px; font-size:.65rem; font-weight:700; padding:.35rem .55rem; border-radius:.6rem; background:#e2eef2; color:#2d3a41; }
    .pill.pulso { background:#e1faf5; color:#1c7e72; }
    .pill.clima { background:#e7f0ff; color:#2b5fa8; }
  .resumo { font-size:.75rem; color:#2d3a41; background:#fff; padding:.4rem .6rem; border:1px solid #dbe7ec; border-radius:.6rem; }
  .setor-filter { display:flex; align-items:center; gap:.6rem; }
  .setor-filter .lbl { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#4a5b63; }
  .select-wrapper { position:relative; }
  .select-wrapper select { appearance:none; -webkit-appearance:none; font-size:.7rem; padding:.45rem 1.7rem .45rem .65rem; border:1px solid #cfdfe5; background:#fff; border-radius:.55rem; outline:none; font-weight:500; color:#264d58; box-shadow:0 1px 2px #0000000b inset; transition:.15s border; }
  .select-wrapper select:focus { border-color:#38b6a5; }
  .select-wrapper .icon { position:absolute; right:.55rem; top:50%; transform:translateY(-50%); font-size:.65rem; pointer-events:none; color:#52727d; }
  .chip { background:#e1faf5; border:1px solid #b4efe3; color:#136d62; font-size:.6rem; padding:.35rem .55rem; border-radius:2rem; display:flex; align-items:center; gap:.35rem; cursor:pointer; user-select:none; }
  .chip:hover { background:#d3f4ed; }
  .chip .x { font-weight:600; line-height:1; }
    .nps-card { background:#fff; border:1px solid #e0edf3; padding:1rem 1.2rem 1.2rem; border-radius:.9rem; box-shadow:0 2px 6px #0000000d; margin-bottom:1.4rem; }
  .nps-value { font-size:1.1rem; font-weight:600; margin-bottom:.4rem; }
  .metodo-hint { font-size:.6rem; color:#546974; margin-bottom:.7rem; line-height:1.1rem; }
    .nps-bars { display:flex; height:28px; border-radius:.5rem; overflow:hidden; background:#f1f5f7; font-size:.65rem; font-weight:600; color:#fff; text-shadow:0 1px 2px #0005; }
    .nps-bars .bar { display:flex; align-items:center; justify-content:center; white-space:nowrap; }
    .bar.promotores { background:#2e7d32; }
    .bar.neutros { background:#fbc02d; color:#3d3d3d; text-shadow:none; }
    .bar.detratores { background:#ff7043; }
    .dist-nps { display:grid; grid-template-columns:repeat(11,1fr); gap:.4rem; margin-top:1rem; font-size:.55rem; }
  .nps-col { background:#f9fbfc; border:1px solid #e0edf3; padding:.35rem .3rem .45rem; border-radius:.4rem; text-align:center; }
  .nps-col span { display:block; line-height:1.05; }
  .nps-label { font-weight:600; }
  .nps-count, .nps-percent { font-size:.55rem; }
  .nps-count.zero, .nps-percent.zero { color:#9aa7b1; }
    .tbl-perguntas { width:100%; border-collapse:collapse; background:#fff; box-shadow:0 2px 8px #0000000d; border:1px solid #e0edf3; }
    .tbl-perguntas th { text-align:left; font-size:.7rem; letter-spacing:.5px; text-transform:uppercase; padding:.65rem .7rem; background:#f5f9fa; }
    .tbl-perguntas td { padding:.55rem .7rem; font-size:.8rem; vertical-align:top; border-top:1px solid #eef3f5; }
    .dist-row { display:flex; gap:2px; background:#f1f5f7; border-radius:.4rem; overflow:hidden; }
    .dist-seg { background:#38b6a5; color:#fff; font-size:.55rem; display:flex; align-items:center; justify-content:center; padding:.25rem .4rem; position:relative; }
    .dist-seg:nth-child(2n) { background:#4f8cff; }
    .erro { background:#ffe9e9; border:1px solid #ffc5c5; color:#d93030; padding:.7rem .9rem; border-radius:.7rem; font-size:.8rem; margin-bottom:1rem; }
  `]
})
export class RelatorioPesquisaComponent {
  report: any = null;
  erro = '';
  loaded = false;
  departments: any[] = [];
  selectedDepartmentId: number | undefined;
  private searchId = 0;
  constructor(private route: ActivatedRoute, private search: SearchService, private dept: DepartmentService) {}
  ngOnInit() {
    this.searchId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.searchId) { this.erro = 'ID inválido'; this.loaded = true; return; }
    this.dept.getAll().subscribe({ next: d => this.departments = d || [], error: () => {} });
    this.reload();
  }
  reload() {
    this.loaded = false;
    this.search.getReport(this.searchId, this.selectedDepartmentId).subscribe({
      next: (data) => { this.report = data; this.loaded = true; },
      error: () => { this.erro = 'Erro ao carregar relatório'; this.loaded = true; }
    });
  }
  clearDept() { this.selectedDepartmentId = undefined; this.reload(); }
  currentDepartmentName() {
    if (!this.selectedDepartmentId) return '';
    const dep = this.departments.find(d => d.id === this.selectedDepartmentId);
    return dep?.name || this.report?.department?.name || 'Setor';
  }
  pct(count: any): string { if (!this.report?.totalRespondentes) return '0%'; const c = Number(count)||0; return ((c/ this.report.totalRespondentes)*100).toFixed(1)+'%'; }
  npsKeys() { return this.report?.npsDistribuicao ? Object.keys(this.report.npsDistribuicao) : []; }
  distEntries(dist: any) { return Object.keys(dist||{}).map(k=> ({ key:k, ...dist[k] })).sort((a,b)=> Number(a.key)-Number(b.key)); }
  getNpsColor(n: number) { if (n>=75) return '#2e7d32'; if (n>=50) return '#38b6a5'; if (n>=0) return '#fbc02d'; return '#ff7043'; }
  formatPercent(p: any) {
    const n = Number(p);
    if (isNaN(n)) return '-';
    if (n === 0) return '0%';
    if (n < 1) return n.toFixed(2).replace(/0$/,'') + '%';
    return Number.isInteger(n) ? n.toFixed(0) + '%' : n.toFixed(1) + '%';
  }
  formatDate(d: any) {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '-'; }
  }
}
