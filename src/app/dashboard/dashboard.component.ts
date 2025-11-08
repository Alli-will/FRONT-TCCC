// ...existing code...
import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuComponent } from "../menu/menu.component";
import { CadastroPesquisaComponent } from "../cadastro-pesquisa/cadastro-pesquisa.component";
import { FormsModule } from "@angular/forms";
import { DashboardService } from "../services/dashboard.service";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, MenuComponent, FormsModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  colaboradores: any[] = [];
  todosDepartamentosInsuficientes(): boolean {
    return this.deptBars.length > 0 && this.deptBars.every((d: any) => d.insuficiente);
  }
  departamentos: any[] = [];
  deptBars: Array<{
    nome: string;
    respondentes: number;
    respostas: number;
    promotores: number;
    detratores: number;
    neutros: number;
    promotoresPct: number;
    detratoresPct: number;
    neutrosPct: number;
    nps: number | null;
    insuficiente: boolean;
  }> = [];
  evolucaoNps: Array<{
    mes: string;
    mesFormatado: string;
    uniqueUsers: number;
    promotores: number;
    neutros: number;
    detratores: number;
    respondentes: number;
    nps: number | null;
  }> = [];
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
  // emotionPercentages removido (módulo Diário descontinuado)
  isAdmin = false;
  // Filtro de período
  selectedPeriod: "all" | "30" | "90" | "180" = "all";

  // Pulse e Clima
  pulseScore: number = 0;
  pulseComment: string = "";
  pulseResults: any[] = [];
  climaQuestion: string = "";
  climaAnswer: string = "";
  climaResults: any[] = [];

  sendPulse() {
    // Exemplo: envie pulseScore e pulseComment via serviço
    // Substitua pelo seu PulseService real
    // this.pulseService.sendPulse(this.pulseScore, this.pulseComment).subscribe(...)
    this.pulseResults.push({ score: this.pulseScore, comment: this.pulseComment });
    this.pulseScore = 0;
    this.pulseComment = "";
  }

  sendClima() {
    // Exemplo: envie climaQuestion e climaAnswer via serviço
    // Substitua pelo seu ClimaService real
    // this.climaService.sendClima(this.climaQuestion, this.climaAnswer).subscribe(...)
    this.climaResults.push({ question: this.climaQuestion, answer: this.climaAnswer });
    this.climaQuestion = "";
    this.climaAnswer = "";
  }

  constructor(
    private dashboardService: DashboardService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  // Métodos de chat de IA removidos

  ngOnInit() {
    this.initResponsive();
    this.isAdmin = this.authService.isAdmin();
    const preload = this.route.snapshot.data["preload"];
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
      this.colaboradoresEmRisco = data.colaboradoresEmRisco || [];
      this.pulsoAtual = data.pulsoAtual || null;
      this.evolucaoNps = Array.isArray(data.evolucaoNps) ? data.evolucaoNps : [];
      this.computeDeptBars();
    }
    // Diário removido: não buscar emotion percentages
    // Remover chamadas duplicadas de carregamento
  }

  ngOnDestroy(): void {
    if (typeof window !== "undefined" && this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
    }
  }

  private buildPeriodParams(): { days?: number } | undefined {
    if (this.selectedPeriod === "all") return undefined;
    return { days: Number(this.selectedPeriod) };
  }

  onPeriodChange() {
    this.carregarDadosDashboard();
  }

  carregarDadosDashboard() {
    const params = this.buildPeriodParams();
    this.dashboardService.getMetrics(params).subscribe({
      next: (data) => {
        this.metricas = data.metricas || {};
        this.npsReal = this.metricas.nps || 0;
        this.essGeral = Math.round(((this.npsReal + 100) / 200) * 100);
        this.colaboradores = (data.colaboradores || []).filter(
          (c: any) => c.npsDriverScore != null
        );
        this.departamentos = data.departamentos || [];
        this.colaboradoresEmRisco = data.colaboradoresEmRisco || [];
        this.pulsoAtual = data.pulsoAtual || null;
        this.evolucaoNps = Array.isArray(data.evolucaoNps) ? data.evolucaoNps : [];
        this.computeDeptBars();
        // Removido cálculo local de ESS geral para não sobrescrever o valor do backend
      },
      error: (err) => {
        // Trate erros de permissão ou conexão
        this.metricas = {
          ativos: 0,
          respondentes: 0,
          nps: 0,
          promotores: 0,
          detratores: 0,
          neutros: 0,
          promotoresPercent: 0,
          detratoresPercent: 0,
        };
        this.colaboradores = [];
        this.departamentos = [];
        this.colaboradoresEmRisco = [];
        this.npsReal = 0;
        this.essGeral = 0;
        this.pulsoAtual = null;
        this.deptBars = [];
      },
    });
  }

  // --- Evolução NPS helpers (Eixos invertidos: X = meses, Y = valor NPS) ---
  // Configurações base do gráfico
  private chartCfg = { width: 800, left: 80, right: 60, top: 20 } as const; // margens equilibradas para centralização e evitar corte do último mês
  // Responsividade do gráfico
  isMobile = false;
  private resizeListener: any;
  private updateResponsiveCfg() {
    if (typeof window === "undefined") return;
    this.isMobile = window.matchMedia("(max-width: 600px)").matches;
  }
  private initResponsive() {
    this.updateResponsiveCfg();
    if (typeof window !== "undefined") {
      this.resizeListener = () => this.updateResponsiveCfg();
      window.addEventListener("resize", this.resizeListener);
    }
  }
  get colW(): number {
    if (this.isMobile) return 70;
    const n = Math.max(1, this.visibleEvolucaoNps.length);
    const baseMin = 80;
    const available = 1100;
    const dynamic = n > 1 ? Math.floor(available / (n - 1)) : baseMin;
    return Math.max(baseMin, Math.min(dynamic, 160));
  }
  get pointRadius(): number {
    return this.isMobile ? 8 : 9;
  }
  get tickFont(): number {
    return this.isMobile ? 16 : 15;
  }
  get labelFont(): number {
    return this.isMobile ? 16 : 15;
  }
  get monthFont(): number {
    return this.isMobile ? 20 : 17;
  }
  get ticksPulse(): number[] {
    return this.isMobile ? [-100, 0, 100] : [-100, -75, -50, -25, 0, 25, 50, 75, 100];
  }

  get visibleEvolucaoNps() {
    if (!Array.isArray(this.evolucaoNps)) return [] as typeof this.evolucaoNps;
    return this.isMobile ? this.evolucaoNps.slice(-6) : this.evolucaoNps;
  }
  get plotHeight(): number {
    return this.isMobile ? 190 : 480;
  }
  get bottomMargin(): number {
    return Math.max(36, this.monthFont + 22);
  }
  get chartHeight(): number {
    return this.chartCfg.top + this.plotHeight + this.bottomMargin + 18;
  }
  get chartWidth(): number {
    const n = Math.max(1, this.visibleEvolucaoNps.length);
    return this.chartCfg.left + (n - 1) * this.colW + this.chartCfg.right;
  }
  get xPlotLeft(): number {
    return this.chartCfg.left;
  }
  get xPlotRight(): number {
    return this.chartWidth - this.chartCfg.right;
  }
  get yPlotTop(): number {
    return this.chartCfg.top;
  }
  get monthLabelY(): number {
    return this.chartHeight - Math.max(4, Math.round(this.monthFont * 0.3));
  }
  formatMesLabel(lbl: string): string {
    if (!lbl) return "";
    if (!this.isMobile) return lbl;
    if (/^\d{2}\/\d{4}$/.test(lbl)) return lbl.slice(0, 2) + "/" + lbl.slice(5);
    return lbl;
  }
  private xAtMonth(idx: number): number {
    return this.chartCfg.left + idx * this.colW;
  }
  getMonthLabelX(idx: number): number {
    const pad = 4;
    if (idx === 0) return Math.max(this.xPlotLeft + pad, this.xAtMonth(idx));
    if (idx === this.visibleEvolucaoNps.length - 1)
      return Math.min(this.xPlotRight - pad, this.xAtMonth(idx));
    return this.xAtMonth(idx);
  }
  getMonthLabelAnchor(idx: number): "start" | "middle" | "end" {
    if (idx === 0) return "start";
    if (idx === this.visibleEvolucaoNps.length - 1) return "end";
    return "middle";
  }
  mapNpsToY(nps: number | null | undefined): number {
    const v = typeof nps === "number" ? Math.max(-100, Math.min(100, nps)) : 0;
    const t = (v + 100) / 200; // 0..1
    return this.chartCfg.top + (1 - t) * this.plotHeight; // +100 no topo, -100 embaixo
  }
  buildPolylinePoints(): string {
    const arr = this.visibleEvolucaoNps;
    if (!Array.isArray(arr)) return "";
    const pts: string[] = [];
    arr.forEach((e, idx) => {
      if (e && typeof e.nps === "number") {
        const x = this.xAtMonth(idx);
        const y = this.mapNpsToY(e.nps);
        pts.push(`${x},${y}`);
      }
    });
    return pts.join(" ");
  }
  hasEvolucaoPoints(): boolean {
    const arr = this.visibleEvolucaoNps;
    return Array.isArray(arr) && arr.some((e) => e && typeof e.nps === "number");
  }

  private getPointXNps(idx: number): number {
    return this.xAtMonth(idx);
  }
  private getPointYNps(idx: number): number {
    const arr = this.visibleEvolucaoNps as any[];
    const e = arr[idx];
    if (!e || typeof e.nps !== "number") return this.mapNpsToY(0);
    return this.mapNpsToY(e.nps);
  }
  private getLabelSideNps(idx: number): "left" | "right" {
    const y = this.getPointYNps(idx);
    let prevY: number | null = null;
    let nextY: number | null = null;
    const arr = this.visibleEvolucaoNps as any[];
    for (let i = idx - 1; i >= 0; i--) {
      const e = arr[i];
      if (e && typeof e.nps === "number") {
        prevY = this.mapNpsToY(e.nps);
        break;
      }
    }
    for (let i = idx + 1; i < arr.length; i++) {
      const e = arr[i];
      if (e && typeof e.nps === "number") {
        nextY = this.mapNpsToY(e.nps);
        break;
      }
    }
    if (prevY !== null && nextY !== null) {
      const dPrev = Math.abs(y - prevY);
      const dNext = Math.abs(y - nextY);
      return dPrev > dNext ? "right" : "left";
    }
    if (prevY !== null) {
      return y < prevY ? "left" : "right";
    }
    if (nextY !== null) {
      return nextY < y ? "left" : "right";
    }
    return "right";
  }
  getLabelXNps(idx: number): number {
    const base = this.getPointXNps(idx);
    const side = this.getLabelSideNps(idx);
    const off = this.isMobile ? 10 : 8;
    const x = base + (side === "right" ? off : -off);
    return Math.max(this.xPlotLeft + 4, Math.min(this.xPlotRight - 4, x));
  }
  getLabelAnchorNps(idx: number): "start" | "end" | "middle" {
    const side = this.getLabelSideNps(idx);
    return side === "right" ? "start" : "end";
  }
  getLabelYNps(idx: number): number {
    const yPoint = this.getPointYNps(idx);
    const above = yPoint - (this.pointRadius + 6);
    const below = yPoint + (this.pointRadius + 14);
    const topLimit = this.chartCfg.top + Math.max(10, Math.round(this.tickFont * 0.8));
    const bottomLimit = this.monthLabelY - 4;
    const chosen = above < topLimit + 4 ? below : above;
    return Math.max(topLimit, Math.min(bottomLimit, chosen));
  }

  getEmotionColor(key: string): string {
    switch (key) {
      case "Muito mal":
        return "#f44336";
      case "Mal":
        return "#ff9800";
      case "Neutro":
        return "#ffc107";
      case "Bem":
        return "#2196f3";
      case "Muito bem":
        return "#1976d2";
      default:
        return "#bbb";
    }
  }

  getCircleDash(percent: number): string {
    const radius = 30;
    const circ = 2 * Math.PI * radius;
    const dash = (percent / 100) * circ;
    return `${dash} ${circ - dash}`;
  }

  getScoreColor(): string {
    if (this.npsReal >= 75) return "#2e7d32"; // verde mais forte para "excelente"
    if (this.npsReal >= 50) return "#38b6a5"; // verde normal para "muito bom"
    if (this.npsReal >= 0) return "#fbc02d"; // amarelo para "neutro"
    return "#ff7043"; // laranja/vermelho para "crítico"
  }

  getScoreLabel(): string {
    if (this.npsReal >= 75) return "Excelente";
    if (this.npsReal >= 50) return "Muito bom";
    if (this.npsReal >= 0) return "Neutro";
    return "Crítico";
  }

  getScoreDesc(): string {
    if (this.npsReal >= 75) return "Excelente: colaboradores altamente engajados.";
    if (this.npsReal >= 50) return "Muito bom: clima positivo e engajamento elevado.";
    if (this.npsReal >= 0) return "Neutro: oportunidade de melhoria.";
    return "Negativo: prioridade de ações corretivas.";
  }

  getScoreDescBg(): string {
    if (this.metricas.respondentes === 0) return "#f5f5f5"; // cinza claro para indisponível
    if (this.npsReal >= 75) return "#e0f2f1"; // verde claro para excelente
    if (this.npsReal >= 50) return "#e6f9f3"; // verde água para muito bom
    if (this.npsReal >= 0) return "#fff8e1"; // amarelo claro para neutro
    return "#fff3e6"; // laranja claro para crítico
  }

  getScoreDescColor(): string {
    if (this.metricas.respondentes === 0) return "#888"; // cinza para indisponível
    if (this.npsReal >= 75) return "#2e7d32"; // verde forte
    if (this.npsReal >= 50) return "#38b6a5"; // verde normal
    if (this.npsReal >= 0) return "#fbc02d"; // amarelo
    return "#ff7043"; // laranja/vermelho
  }

  formatDate(d: any) {
    if (!d) return "";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("pt-BR");
  }

  private computeDeptBars() {
    const bars: Array<{
      nome: string;
      respondentes: number;
      respostas: number;
      promotores: number;
      detratores: number;
      neutros: number;
      promotoresPct: number;
      detratoresPct: number;
      neutrosPct: number;
      nps: number | null;
      insuficiente: boolean;
    }> = [];
    for (const d of this.departamentos || []) {
      const nome = d?.nome || "Sem departamento";
      const unique = Number(d?.uniqueUsers ?? 0) || 0; // distintos por usuário
      const prom = Number(d?.promotores ?? 0) || 0;
      const det = Number(d?.detratores ?? 0) || 0;
      const neu = Number(d?.neutros ?? 0) || 0;
      const totalResp = Math.max(0, Number(d?.respostas ?? 0));
      const insuficiente = unique < 3;
      const promPct = totalResp ? Math.round((prom / totalResp) * 1000) / 10 : 0;
      const detPct = totalResp ? Math.round((det / totalResp) * 1000) / 10 : 0;
      const neuPct = Math.max(0, parseFloat((100 - promPct - detPct).toFixed(1)));
      const npsVal = typeof d?.nps === "number" ? d.nps : 0;
      bars.push({
        nome,
        respondentes: unique,
        respostas: totalResp,
        promotores: prom,
        detratores: det,
        neutros: neu,
        promotoresPct: promPct,
        detratoresPct: detPct,
        neutrosPct: neuPct,
        nps: insuficiente ? null : npsVal,
        insuficiente,
      });
    }
    this.deptBars = bars.sort((a, b) => a.nome.localeCompare(b.nome));
  }
}
