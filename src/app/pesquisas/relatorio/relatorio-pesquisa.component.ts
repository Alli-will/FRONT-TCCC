import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SearchService } from "../../services/search.service";
import { DepartmentService } from "../../services/department.service";
import { MenuComponent } from "../../menu/menu.component";

@Component({
  selector: "app-relatorio-pesquisa",
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./relatorio-pesquisa.component.html",
  styleUrls: ["./relatorio-pesquisa.component.css"],
})
export class RelatorioPesquisaComponent {
  report: any = null;
  erro = "";
  loaded = false;
  departments: any[] = [];
  selectedDepartmentId: number | undefined;
  private searchId = 0;
  // modal respostas qualitativas
  showTextModal = false;
  loadingTextAnswers = false;
  textAnswers: { texto: string }[] = [];
  textQuestionTitle = '';
  textTotal = 0;
  textMinThreshold = 0;
  constructor(
    private route: ActivatedRoute,
    private search: SearchService,
    private dept: DepartmentService
  ) {}
  ngOnInit() {
    this.searchId = Number(this.route.snapshot.paramMap.get("id"));
    if (!this.searchId) {
      this.erro = "ID inválido";
      this.loaded = true;
      return;
    }
    this.dept.getAll().subscribe({ next: (d) => (this.departments = d || []), error: () => {} });
    this.reload();
  }
  reload() {
    this.loaded = false;
    this.search.getReport(this.searchId, this.selectedDepartmentId).subscribe({
      next: (data) => {
        this.report = data;
        this.loaded = true;
      },
      error: () => {
        this.erro = "Erro ao carregar relatório";
        this.loaded = true;
      },
    });
  }
  clearDept() {
    this.selectedDepartmentId = undefined;
    this.reload();
  }
  currentDepartmentName() {
    if (!this.selectedDepartmentId) return "";
    const dep = this.departments.find((d) => d.id === this.selectedDepartmentId);
    return dep?.name || this.report?.department?.name || "Setor";
  }
  pct(count: any): string {
    if (!this.report?.totalRespondentes) return "0%";
    const c = Number(count) || 0;
    return ((c / this.report.totalRespondentes) * 100).toFixed(1) + "%";
  }
  npsKeys() {
    return this.report?.npsDistribuicao ? Object.keys(this.report.npsDistribuicao) : [];
  }
  distEntries(dist: any) {
    return Object.keys(dist || {})
      .map((k) => ({ key: k, ...dist[k] }))
      .sort((a, b) => Number(a.key) - Number(b.key));
  }
  // Funções para gerar gradient e labels
  buildStack(_: any, __?: string) {
    return [];
  }

  gradientSegments(dist: any, tipo?: string) {
    if (!dist) return [];
    const scores = tipo === "clima" ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const raw = scores
      .map((s) => {
        const entry = dist[String(s)] || { percent: 0 };
        const percent = typeof entry.percent === "number" ? entry.percent : 0;
        return { score: s, percent, color: this.getScoreBandColor(s, tipo) };
      })
      .filter((r) => r.percent > 0);
    // Merge adjacentes de mesma cor
    const merged: { color: string; percent: number; scores: number[] }[] = [];
    raw.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && last.color === r.color) {
        last.percent += r.percent;
        last.scores.push(r.score);
      } else {
        merged.push({ color: r.color, percent: r.percent, scores: [r.score] });
      }
    });
    let acc = 0;
    return merged.map((m) => {
      const start = acc;
      acc += m.percent;
      const end = acc > 100 ? 100 : acc;
      const width = end - start;
      return {
        start,
        end,
        width,
        percent: m.percent,
        color: m.color,
        textColor: m.color === "#fbc02d" ? "#2d2d2d" : "#fff",
      };
    });
  }

  gradientBackground(dist: any, tipo?: string) {
    const segments = this.gradientSegments(dist, tipo);
    if (!segments.length) return "#f1f5f7";
    const stops: string[] = [];
    segments.forEach((m) => {
      stops.push(`${m.color} ${m.start.toFixed(2)}%`, `${m.color} ${m.end.toFixed(2)}%`);
    });
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }
  getScoreBandColor(score: number, tipo?: string) {
    // Escala pulso (0-10) -> Detratores 0-6 (vermelho), Neutros 7-8 (amarelo), Promotores 9-10 (verde)
    // Escala clima (1-5) -> 1-2 vermelho, 3 amarelo, 4-5 verde
    if (tipo === "clima") {
      if (score <= 2) return "#e53935";
      if (score === 3) return "#fbc02d";
      return "#43a047";
    }
    if (score <= 6) return "#e53935";
    if (score <= 8) return "#fbc02d";
    return "#43a047";
  }
  getNpsColor(n: number) {
    if (n >= 75) return "#2e7d32";
    if (n >= 50) return "#38b6a5";
    if (n >= 0) return "#fbc02d";
    return "#ff7043";
  }
  formatPercent(p: any) {
    const n = Number(p);
    if (isNaN(n)) return "-";
    if (n === 0) return "0%";
    if (n < 1) return n.toFixed(2).replace(/0$/, "") + "%";
    return Number.isInteger(n) ? n.toFixed(0) + "%" : n.toFixed(1) + "%";
  }
  formatDate(d: any) {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }
  canShowNps() {
    if (this.report?.tipo !== "pulso") return false;
    if (this.report?.nps === null || this.report?.nps === undefined) return false;
    const total = this.report?.totalRespondentes || 0;
    if (total < 2) return false; // bloqueia se menos de 2 respondentes, geral ou setor
    return true;
  }
  canShowPerguntas() {
    const total = this.report?.totalRespondentes || 0;
    if (total < 2) return false;
    return true;
  }
  openTextAnswersModal(index: number, questionText: string) {
    this.showTextModal = true;
    this.loadingTextAnswers = true;
    this.textAnswers = [];
    this.textQuestionTitle = questionText;
    this.search
      .getTextAnswers(this.searchId, index, this.selectedDepartmentId)
      .subscribe({
        next: (res: any) => {
          this.textAnswers = res?.respostas || [];
          this.textTotal = res?.total || 0;
          this.textMinThreshold = res?.min || 0;
          this.loadingTextAnswers = false;
        },
        error: () => {
          this.textAnswers = [];
          this.textTotal = 0;
          this.textMinThreshold = 0;
          this.loadingTextAnswers = false;
        },
      });
  }
  closeTextAnswersModal() {
    this.showTextModal = false;
  }
  showSegPercent(_: any) {
    return false;
  }
  scoreClasse(k: string) {
    const v = Number(k);
    if (isNaN(v)) return "";
    if (v <= 6) return "detrator";
    if (v <= 8) return "neutro";
    return "promotor";
  }
  scoreTooltip(k: string) {
    const v = Number(k);
    if (isNaN(v)) return "";
    let cat = v <= 6 ? "Detrator" : v <= 8 ? "Neutro" : "Promotor";
    const count = this.report?.npsDistribuicao?.[k]?.count || 0;
    const percent = this.report?.npsDistribuicao?.[k]?.percent || 0;
    return `Nota ${k} • ${count} respostas • ${this.formatPercent(percent)} • ${cat}`;
  }
}
