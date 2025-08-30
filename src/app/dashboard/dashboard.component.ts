// ...existing code...
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuComponent } from "../menu/menu.component";
import { CadastroPesquisaComponent } from '../cadastro-pesquisa/cadastro-pesquisa.component';
import { FormsModule } from "@angular/forms";
import { DashboardService } from '../services/dashboard.service';
import { EssThermometerComponent } from '../ess-thermometer/ess-thermometer.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, MenuComponent, FormsModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  colaboradores: any[] = [];
  todosDepartamentosInsuficientes(): boolean {
    return this.deptBars.length > 0 && this.deptBars.every((d: any) => d.insuficiente);
  }
  departamentos: any[] = [];
  deptBars: Array<{ nome: string; respondentes: number; promotores: number; detratores: number; neutros: number; promotoresPct: number; detratoresPct: number; neutrosPct: number; nps: number | null; insuficiente: boolean }>= [];
  colaboradoresEmRisco: any[] = [];
  metricas: any = {
    ativos: 0,
    respondentes: 0,
    nps: 0,
    promotores: 0,
    detratores: 0,
    neutros: 0,
    promotoresPercent: 0,
    detratoresPercent: 0,
  };
  // Gauge interno (0-100) derivado do NPS real (-100 a 100)
  essGeral: number = 0;
  npsReal: number = 0;
  pulsoAtual: any = null;
  // IA removida
  busca: string = "";
  resultadosBusca: any[] = [];
  emotionPercentages: any[] = [];
  loadingEmotions = false;
  isAdmin = false;

  // Pulse e Clima
  pulseScore: number = 0;
  pulseComment: string = '';
  pulseResults: any[] = [];
  climaQuestion: string = '';
  climaAnswer: string = '';
  climaResults: any[] = [];

  sendPulse() {
    // Exemplo: envie pulseScore e pulseComment via serviço
    // Substitua pelo seu PulseService real
    // this.pulseService.sendPulse(this.pulseScore, this.pulseComment).subscribe(...)
    this.pulseResults.push({ score: this.pulseScore, comment: this.pulseComment });
    this.pulseScore = 0;
    this.pulseComment = '';
  }

  sendClima() {
    // Exemplo: envie climaQuestion e climaAnswer via serviço
    // Substitua pelo seu ClimaService real
    // this.climaService.sendClima(this.climaQuestion, this.climaAnswer).subscribe(...)
    this.climaResults.push({ question: this.climaQuestion, answer: this.climaAnswer });
    this.climaQuestion = '';
    this.climaAnswer = '';
  }


  constructor(private dashboardService: DashboardService, private route: ActivatedRoute, private authService: AuthService) {}

  // Métodos de chat de IA removidos

  ngOnInit() {
  this.isAdmin = this.authService.isAdmin();
    const preload = this.route.snapshot.data['preload'];
    if (preload) {
  const data = preload.metrics;
  this.metricas = data.metricas || {};
  // Guarda NPS real (-100..100)
  this.npsReal = this.metricas.nps || 0;
  // Mapeia para 0..100 para o círculo: (-100 -> 0) (0 -> 50) (100 -> 100)
  this.essGeral = Math.round(((this.npsReal + 100) / 200) * 100);
  // Agora filtramos por quem respondeu (tem npsDriverScore != null)
  this.colaboradores = (data.colaboradores || []).filter((c: any) => c.npsDriverScore != null);
  this.departamentos = data.departamentos || [];
  this.colaboradoresEmRisco = (data.colaboradoresEmRisco || []);
  this.pulsoAtual = data.pulsoAtual || null;
  this.computeDeptBars();
    }
    this.fetchEmotionPercentages();
    // Remover chamadas duplicadas de carregamento
  }

  carregarDadosDashboard() {
    this.dashboardService.getMetrics().subscribe({
      next: (data) => {
  this.metricas = data.metricas || {};
  this.npsReal = this.metricas.nps || 0;
  this.essGeral = Math.round(((this.npsReal + 100) / 200) * 100);
  this.colaboradores = (data.colaboradores || []).filter((c: any) => c.npsDriverScore != null);
  this.departamentos = data.departamentos || [];
  this.colaboradoresEmRisco = (data.colaboradoresEmRisco || []);
  this.pulsoAtual = data.pulsoAtual || null;
  this.computeDeptBars();
        // Removido cálculo local de ESS geral para não sobrescrever o valor do backend
      },
      error: (err) => {
        // Trate erros de permissão ou conexão
  this.metricas = { ativos: 0, respondentes: 0, nps: 0, promotores: 0, detratores: 0, neutros: 0, promotoresPercent: 0, detratoresPercent: 0 };
        this.colaboradores = [];
        this.departamentos = [];
        this.colaboradoresEmRisco = [];
  this.npsReal = 0;
  this.essGeral = 0;
  this.pulsoAtual = null;
  this.deptBars = [];
      }
    });
  }

  fetchEmotionPercentages() {
    this.loadingEmotions = true;
    this.dashboardService.getEmotionPercentages().subscribe({
      next: (data) => {
        this.emotionPercentages = data;
        this.loadingEmotions = false;
      },
      error: () => {
        this.emotionPercentages = [];
        this.loadingEmotions = false;
      }
    });
  }

  // buscarColaborador() {
  //   const termo = this.busca.trim().toLowerCase();
  //   if (!termo) {
  //     this.resultadosBusca = [];
  //     return;
  //   }
  //   this.resultadosBusca = this.colaboradores.filter(
  //     (c) =>
  //       c.nome.toLowerCase().includes(termo) ||
  //       c.departamento.toLowerCase().includes(termo)
  //   );
  // }

  getEmotionColor(key: string): string {
    switch (key) {
      case 'Muito mal': return '#f44336'; // vermelho
      case 'Mal': return '#ff9800'; // laranja
      case 'Neutro': return '#ffc107'; // amarelo
      case 'Bem': return '#2196f3'; // azul claro
      case 'Muito bem': return '#1976d2'; // azul escuro
      default: return '#bbb';
    }
  }

  getCircleDash(percent: number): string {
    const radius = 30;
    const circ = 2 * Math.PI * radius;
    const dash = (percent / 100) * circ;
    return `${dash} ${circ - dash}`;
  }


  // Cores e textos baseados em NPS real
  getScoreColor(): string {
    if (this.npsReal >= 75) return '#2e7d32'; // verde mais forte para "excelente"
    if (this.npsReal >= 50) return '#38b6a5'; // verde normal para "muito bom"
    if (this.npsReal >= 0) return '#fbc02d';  // amarelo para "neutro"
    return '#ff7043';                         // laranja/vermelho para "crítico"
  }

  getScoreLabel(): string {
    if (this.npsReal >= 75) return 'Excelente';
    if (this.npsReal >= 50) return 'Muito bom';
    if (this.npsReal >= 0) return 'Neutro';
    return 'Crítico';
  }

  getScoreDesc(): string {
    if (this.npsReal >= 75) return 'Excelente: colaboradores altamente engajados.';
    if (this.npsReal >= 50) return 'Muito bom: clima positivo e engajamento elevado.';
    if (this.npsReal >= 0) return 'Neutro: oportunidade de melhoria.';
    return 'Negativo: prioridade de ações corretivas.';
  }

  getScoreDescBg(): string {
  if (this.metricas.respondentes === 0) return '#f5f5f5'; // cinza claro para indisponível
  if (this.npsReal >= 75) return '#e0f2f1'; // verde claro para excelente
  if (this.npsReal >= 50) return '#e6f9f3'; // verde água para muito bom
  if (this.npsReal >= 0) return '#fff8e1';  // amarelo claro para neutro
  return '#fff3e6';                         // laranja claro para crítico
  }

  getScoreDescColor(): string {
  if (this.metricas.respondentes === 0) return '#888'; // cinza para indisponível
  if (this.npsReal >= 75) return '#2e7d32'; // verde forte
  if (this.npsReal >= 50) return '#38b6a5'; // verde normal
  if (this.npsReal >= 0) return '#fbc02d';  // amarelo
  return '#ff7043';                         // laranja/vermelho
  }

  formatDate(d: any) {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('pt-BR');
  }

  private computeDeptBars() {
    const by: Record<string, { prom: number; det: number; neu: number; total: number; nps?: number }> = {};
    // usar colaboradores (cada um tem departamento e categoria)
    for (const c of this.colaboradores) {
      const dept = c.departamento || 'Sem departamento';
      if (!by[dept]) by[dept] = { prom: 0, det: 0, neu: 0, total: 0 };
      by[dept].total++;
      if (c.categoria === 'promotor') by[dept].prom++;
      else if (c.categoria === 'detrator') by[dept].det++;
      else by[dept].neu++;
    }
    // opcional: usar NPS do backend por departamento se disponível
    const npsByDept: Record<string, number> = {};
    for (const d of this.departamentos || []) {
      if (typeof d?.nome === 'string' && typeof d?.nps === 'number') npsByDept[d.nome] = d.nps;
    }
    this.deptBars = Object.entries(by).map(([nome, v]) => {
      const total = v.total || 0;
      const promPct = total ? Math.round((v.prom / total) * 1000) / 10 : 0;
      const detPct = total ? Math.round((v.det / total) * 1000) / 10 : 0;
      const neuPct = Math.max(0, 100 - promPct - detPct); // garante soma 100
  const insuficiente = total < 2; // considerar apenas se >= 2 respondentes
      // calcular NPS se backend não trouxe
      const npsCalc = total ? Math.round(((v.prom / total) - (v.det / total)) * 100) : 0;
      const npsBack = (nome in npsByDept) ? npsByDept[nome] : npsCalc;
      const nps: number | null = insuficiente ? null : npsBack;
      return {
        nome,
        respondentes: total,
        promotores: v.prom,
        detratores: v.det,
        neutros: v.neu,
        promotoresPct: promPct,
        detratoresPct: detPct,
        neutrosPct: neuPct,
        nps,
        insuficiente
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }
}
