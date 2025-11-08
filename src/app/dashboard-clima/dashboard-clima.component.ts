import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DashboardService } from "../services/dashboard.service";
import { MenuComponent } from "../menu/menu.component";

@Component({
  selector: "app-dashboard-clima",
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent],
  templateUrl: "./dashboard-clima.component.html",
  styleUrls: ["./dashboard-clima.component.css"],
})
export class DashboardClimaComponent implements OnInit, OnDestroy, AfterViewInit {
  selectedPeriod: "all" | "30" | "90" | "180" = "all";
  metricas: any = {
    respondentes: 0,
    pesquisas: 0,
    mediaGeral: 0,
    essClima: 0,
    favoraveis: 0,
    neutros: 0,
    desfavoraveis: 0,
  };
  departamentos: Array<{
    nome: string;
    uniqueUsers: number;
    respostas: number;
    media: number;
    favoraveis: number;
    neutros: number;
    desfavoraveis: number;
  }> = [];
  evolucaoClima: Array<{
    mes: string;
    mesFormatado: string;
    uniqueUsers: number;
    promotores: number;
    neutros: number;
    detratores: number;
    respondentes: number;
    media: number | null;
    mediaPct: number | null;
    nps?: number | null;
  }> = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.initResponsive();
    this.load();
  }
  ngAfterViewInit(): void {
    // Ajuste inicial do espaçamento horizontal após renderização
    setTimeout(() => this.fitColWToContainer(), 0);
  }
  ngOnDestroy(): void {
    if (typeof window !== "undefined" && this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
    }
  }

  private buildParams(): { days?: number } | undefined {
    if (this.selectedPeriod === "all") return undefined;
    return { days: Number(this.selectedPeriod) };
  }

  onPeriodChange() {
    this.load();
  }

  load() {
    const params = this.buildParams();
    this.dashboardService.getClimaMetrics(params).subscribe({
      next: (data) => {
        this.metricas = data?.metricas || this.metricas;
        this.departamentos = Array.isArray(data?.departamentos) ? data?.departamentos : [];
        this.evolucaoClima = Array.isArray(data?.evolucaoClima) ? data?.evolucaoClima : [];
        // Ajustar espaçamento após carregar dados
        setTimeout(() => this.fitColWToContainer(), 0);
      },
      error: () => {
        this.metricas = {
          respondentes: 0,
          pesquisas: 0,
          mediaGeral: 0,
          essClima: 0,
          favoraveis: 0,
          neutros: 0,
          desfavoraveis: 0,
        };
        this.departamentos = [];
        this.evolucaoClima = [];
      },
    });
  }

  // Helpers
  formatPercent(n: number) {
    return isFinite(n) ? n : 0;
  }

  // Evolução chart helpers (eixos invertidos: X = meses, Y = média Likert 1..5)
  private chartCfg = { left: 80, right: 60, top: 20 } as const;
  // Responsividade
  isMobile = false;
  private resizeListener: any;
  @ViewChild("climaChartHost") climaChartHost?: ElementRef<HTMLDivElement>;
  private dynamicColW: number | null = null;
  private updateResponsiveCfg() {
    if (typeof window === "undefined") return;
    this.isMobile = window.matchMedia("(max-width: 600px)").matches;
    this.fitColWToContainer();
  }
  private initResponsive() {
    this.updateResponsiveCfg();
    if (typeof window !== "undefined") {
      this.resizeListener = () => this.updateResponsiveCfg();
      window.addEventListener("resize", this.resizeListener);
    }
  }
  private fitColWToContainer() {
    try {
      const host = this.climaChartHost?.nativeElement;
      if (!host) {
        this.dynamicColW = null;
        return;
      }
      const width = host.clientWidth || 0;
      const n = Math.max(1, this.visibleEvolucaoClima.length);
      if (n <= 1 || width <= 0) {
        this.dynamicColW = null;
        return;
      }
      const available = width - this.chartCfg.left - this.chartCfg.right;
      if (available > 0) {
        const computed = available / (n - 1);
        const minBase = this.isMobile ? 80 : 60;
        this.dynamicColW = Math.max(minBase, Math.floor(computed));
      } else {
        this.dynamicColW = null;
      }
    } catch {
      this.dynamicColW = null;
    }
  }
  // Dimensões e escalas responsivas
  // Ajuste fino mobile: reduzir ~25% para não ocupar tanto espaço vertical
  // Aumentar leve espaçamento horizontal entre meses no mobile para melhorar legibilidade
  get colW(): number {
    // largura mínima baseada em largura aproximada dos rótulos (MM/AA ~ 40px em fonte 20) + gap
    const min = this.isMobile ? 90 : 60;
    const base = this.dynamicColW ?? (this.isMobile ? 80 : 60);
    return Math.max(min, base);
  }
  get pointRadius(): number {
    return this.isMobile ? 8 : 5;
  }
  get tickFont(): number {
    return this.isMobile ? 16 : 10;
  }
  get labelFont(): number {
    return this.isMobile ? 16 : 10;
  }
  get monthFont(): number {
    return this.isMobile ? 20 : 11;
  }
  // Escala dinâmica no mobile: aproxima a faixa vertical ao intervalo real dos últimos meses para aumentar o contraste visual.
  // Desktop mantém escala fixa 1..5 para referência global.
  private get yMinLikert(): number {
    if (!this.isMobile) return 1;
    const arr = this.visibleEvolucaoClima
      .filter((e) => typeof e.media === "number")
      .map((e) => e.media as number);
    if (!arr.length) return 1;
    const rawMin = Math.min(...arr);
    // padding inferior 0.2 e clamp mínimo 1
    return Math.max(1, parseFloat((rawMin - 0.2).toFixed(2)));
  }
  private get yMaxLikert(): number {
    if (!this.isMobile) return 5;
    const arr = this.visibleEvolucaoClima
      .filter((e) => typeof e.media === "number")
      .map((e) => e.media as number);
    if (!arr.length) return 5;
    const rawMax = Math.max(...arr);
    // padding superior 0.2 e clamp máximo 5
    return Math.min(5, parseFloat((rawMax + 0.2).toFixed(2)));
  }
  get ticksClima(): number[] {
    if (!this.isMobile) return [1, 2, 3, 4, 5];
    const min = this.yMinLikert;
    const max = this.yMaxLikert;
    if (max - min < 0.01) {
      // intervalo muito pequeno: mostra só valor e +/-0.2 ajustado dentro dos limites
      const down = Math.max(1, parseFloat((min - 0.2).toFixed(1)));
      const up = Math.min(5, parseFloat((max + 0.2).toFixed(1)));
      return [down, min, up];
    }
    const mid = parseFloat(((min + max) / 2).toFixed(1));
    return [min, mid, max];
  }
  get visibleEvolucaoClima() {
    if (!Array.isArray(this.evolucaoClima)) return [] as typeof this.evolucaoClima;
    // Mobile: limitar a 5 últimos meses
    return this.isMobile ? this.evolucaoClima.slice(-5) : this.evolucaoClima;
  }
  formatMesLabel(lbl: string): string {
    if (!lbl) return "";
    if (!this.isMobile) return lbl;
    if (/^\d{2}\/\d{4}$/.test(lbl)) return lbl.slice(0, 2) + "/" + lbl.slice(5);
    return lbl;
  }
  // Dimensões derivadas
  get plotHeight(): number {
    return this.isMobile ? 190 : 160;
  }
  // Aumentar margem inferior para afastar eixo X do eixo Y (plot area)
  get bottomMargin(): number {
    return Math.max(28, this.monthFont + 14);
  }
  get chartHeight(): number {
    return this.chartCfg.top + this.plotHeight + this.bottomMargin;
  }
  get chartWidth(): number {
    const n = Math.max(1, this.visibleEvolucaoClima.length);
    return this.chartCfg.left + (n - 1) * this.colW + this.chartCfg.right;
  }
  get xPlotLeft(): number {
    return this.chartCfg.left;
  }
  get xPlotRight(): number {
    return this.chartWidth - this.chartCfg.right;
  }
  // Mover rótulos dos meses mais para baixo
  get monthLabelY(): number {
    return this.chartHeight - Math.max(4, Math.round(this.monthFont * 0.3));
  }
  private xAtMonth(idx: number): number {
    return this.chartCfg.left + idx * this.colW;
  }
  getMonthLabelX(idx: number): number {
    const pad = 4;
    if (idx === 0) return Math.max(this.xPlotLeft + pad, this.xAtMonth(idx));
    if (idx === this.visibleEvolucaoClima.length - 1)
      return Math.min(this.xPlotRight - pad, this.xAtMonth(idx));
    return this.xAtMonth(idx);
  }
  getMonthLabelAnchor(idx: number): "start" | "middle" | "end" {
    if (idx === 0) return "start";
    if (idx === this.visibleEvolucaoClima.length - 1) return "end";
    return "middle";
  }
  mapLikertToY(score: number | null | undefined): number {
    // No desktop: escala fixa 1..5; no mobile usa faixa dinâmica derivada dos dados visíveis.
    const sBase = typeof score === "number" ? score : 3;
    const min = this.yMinLikert;
    const max = this.yMaxLikert;
    let s = Math.max(min, Math.min(max, sBase));
    let t: number;
    if (max - min < 1e-6) {
      // evita divisão por zero: centraliza
      t = 0.5;
    } else {
      t = (s - min) / (max - min); // 0..1
    }
    return this.chartCfg.top + (1 - t) * this.plotHeight; // topo = max, base = min
  }
  buildPolylinePoints(): string {
    const arr = this.visibleEvolucaoClima;
    if (!Array.isArray(arr)) return "";
    const pts: string[] = [];
    arr.forEach((e, idx) => {
      if (e && typeof e.media === "number") {
        const x = this.xAtMonth(idx);
        const y = this.mapLikertToY(e.media);
        pts.push(`${x},${y}`);
      }
    });
    return pts.join(" ");
  }
  hasEvolucaoPoints(): boolean {
    const arr = this.visibleEvolucaoClima;
    return Array.isArray(arr) && arr.some((e) => e && typeof e.media === "number");
  }

  // Posição dos rótulos: evita sobrepor a linha movendo o texto para a esquerda/direita conforme a inclinação
  private getPointX(idx: number): number {
    return this.xAtMonth(idx);
  }
  private getPointY(idx: number): number {
    const arr = this.visibleEvolucaoClima as any[];
    const e = arr[idx];
    if (!e || typeof e.media !== "number") return this.mapLikertToY(3);
    return this.mapLikertToY(e.media);
  }
  private getLabelSide(idx: number): "left" | "right" | "middle" {
    const y = this.getPointY(idx);
    let prevY: number | null = null;
    let nextY: number | null = null;
    const arr = this.visibleEvolucaoClima as any[];
    for (let i = idx - 1; i >= 0; i--) {
      const e = arr[i];
      if (e && typeof e.media === "number") {
        prevY = this.mapLikertToY(e.media);
        break;
      }
    }
    for (let i = idx + 1; i < arr.length; i++) {
      const e = arr[i];
      if (e && typeof e.media === "number") {
        nextY = this.mapLikertToY(e.media);
        break;
      }
    }
    const EPS = 1; // segmento praticamente plano
    if (prevY !== null && nextY !== null && Math.abs(prevY - y) < EPS && Math.abs(nextY - y) < EPS)
      return "middle";
    if (prevY !== null && nextY !== null) {
      const dPrev = Math.abs(y - prevY);
      const dNext = Math.abs(y - nextY);
      return dPrev > dNext ? "right" : "left";
    }
    if (prevY !== null) return y < prevY ? "left" : "right";
    if (nextY !== null) return nextY < y ? "left" : "right";
    return "right";
  }
  getLabelX(idx: number): number {
    const base = this.getPointX(idx);
    const side = this.getLabelSide(idx);
    if (side === "middle") return base;
    const off = this.isMobile ? 14 : 10;
    const x = base + (side === "right" ? off : -off);
    return Math.max(this.xPlotLeft + 4, Math.min(this.xPlotRight - 4, x));
  }
  getLabelAnchor(idx: number): "start" | "end" | "middle" {
    const side = this.getLabelSide(idx);
    if (side === "middle") return "middle";
    return side === "right" ? "start" : "end";
  }
  getLabelY(idx: number): number {
    const yPoint = this.getPointY(idx);
    const above = yPoint - (this.pointRadius + 6);
    const below = yPoint + (this.pointRadius + 14);
    const topLimit = this.chartCfg.top + Math.max(10, Math.round(this.tickFont * 0.8));
    const bottomLimit = this.monthLabelY - 4;
    const chosen = above < topLimit + 4 ? below : above;
    return Math.max(topLimit, Math.min(bottomLimit, chosen));
  }
}
