import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuComponent } from "../menu/menu.component";
import { FormsModule } from "@angular/forms";
import { DashboardService } from '../services/dashboard.service';
import { EssThermometerComponent } from '../ess-thermometer/ess-thermometer.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, MenuComponent, FormsModule, EssThermometerComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  colaboradores: any[] = [];
  departamentos: any[] = [];
  colaboradoresEmRisco: any[] = [];
  metricas: any = {
    ativos: 0,
    bemEstarGeral: 0,
    altoRisco: 0,
    altoRiscoPercent: 0,
    sessoesTerapia: 0,
    variacaoSessoes: 0,
    totalRespostasDiario: 0,
  };
  essGeral: number = 0;
  showIA: boolean = true;
  iaMensagem: string =
    "Olá! Sou sua assistente de IA para análise de bem-estar dos colaboradores. Posso ajudar você a identificar riscos psicossociais, analisar tendências emocionais e sugerir ações para melhorar o clima da equipe.";
  busca: string = "";
  resultadosBusca: any[] = [];
  emotionPercentages: any[] = [];
  loadingEmotions = false;

  constructor(private dashboardService: DashboardService, private route: ActivatedRoute) {}

  ngOnInit() {
    const preload = this.route.snapshot.data['preload'];
    if (preload) {
      const data = preload.metrics;
      this.metricas = data.metricas || {};
      // Filtra colaboradores para exibir apenas quem já respondeu ao diário (bemEstar > 0)
      this.colaboradores = (data.colaboradores || []).filter((c: any) => c.bemEstar && c.bemEstar > 0);
      this.departamentos = data.departamentos || [];
      this.colaboradoresEmRisco = (data.colaboradoresEmRisco || []).filter((c: any) => c.bemEstar && c.bemEstar > 0);
      this.essGeral = preload.essGeral.ess ?? 0;
    }
    this.fetchEmotionPercentages();
    // Remover chamadas duplicadas de carregamento
  }

  carregarDadosDashboard() {
    this.dashboardService.getMetrics().subscribe({
      next: (data) => {
        this.metricas = data.metricas || {};
        // Filtra colaboradores para exibir apenas quem já respondeu ao diário (bemEstar > 0)
        this.colaboradores = (data.colaboradores || []).filter((c: any) => c.bemEstar && c.bemEstar > 0);
        this.departamentos = data.departamentos || [];
        this.colaboradoresEmRisco = (data.colaboradoresEmRisco || []).filter((c: any) => c.bemEstar && c.bemEstar > 0);
        // Removido cálculo local de ESS geral para não sobrescrever o valor do backend
      },
      error: (err) => {
        // Trate erros de permissão ou conexão
        this.metricas = { ativos: 0, bemEstarGeral: 0, altoRisco: 0, altoRiscoPercent: 0 };
        this.colaboradores = [];
        this.departamentos = [];
        this.colaboradoresEmRisco = [];
        this.essGeral = 0;
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

  buscarColaborador() {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) {
      this.resultadosBusca = [];
      return;
    }
    this.resultadosBusca = this.colaboradores.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.departamento.toLowerCase().includes(termo)
    );
  }

  // Simulação de ações recomendadas pela IA
  get acoesRecomendadas() {
    const acoes: { texto: string; cor: string }[] = [];
    // Conversa urgente e apoio psicológico para colaboradores em alto risco
    this.colaboradoresEmRisco.forEach(c => {
      acoes.push({
        texto: `Conversa urgente com ${c.nome}`,
        cor: '#F44336',
      });
      acoes.push({
        texto: `Oferecer apoio psicológico para ${c.nome}`,
        cor: '#2196F3',
      });
    });
    // Ações comportamentais para departamentos com média baixa
    this.departamentos.forEach(dep => {
      if (dep.mediaBemEstar < 6) {
        acoes.push({
          texto: `Promover roda de conversa no departamento ${dep.nome}`,
          cor: '#FF9800',
        });
        acoes.push({
          texto: `Oferecer palestra sobre bem-estar emocional para o departamento ${dep.nome}`,
          cor: '#9C27B0',
        });
      }
    });
    if (acoes.length === 0) {
      acoes.push({ texto: 'Nenhuma ação urgente recomendada no momento.', cor: '#4CAF50' });
    }
    return acoes;
  }

  getEmotionColor(key: string): string {
    switch (key) {
      case 'triste': return '#f44336'; // vermelho
      case 'frustrado': return '#ff9800'; // laranja
      case 'neutro': return '#ffc107'; // amarelo
      case 'tranquilo': return '#2196f3'; // azul claro
      case 'realizado': return '#1976d2'; // azul escuro
      default: return '#bbb';
    }
  }

  getCircleDash(percent: number): string {
    const radius = 30;
    const circ = 2 * Math.PI * radius;
    const dash = (percent / 100) * circ;
    return `${dash} ${circ - dash}`;
  }
}
