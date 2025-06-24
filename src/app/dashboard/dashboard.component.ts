import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuComponent } from "../menu/menu.component";
import { FormsModule } from "@angular/forms";
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, MenuComponent, FormsModule],
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
  };
  showIA: boolean = true;
  iaMensagem: string =
    "Olá! Sou sua assistente de IA para análise de bem-estar dos colaboradores. Posso ajudar você a identificar riscos psicossociais, analisar tendências emocionais e sugerir ações para melhorar o clima da equipe.";
  busca: string = "";
  resultadosBusca: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.carregarDadosDashboard();
  }

  carregarDadosDashboard() {
    this.dashboardService.getMetrics().subscribe({
      next: (data) => {
        this.metricas = data.metricas || {};
        this.colaboradores = data.colaboradores || [];
        this.departamentos = data.departamentos || [];
        this.colaboradoresEmRisco = data.colaboradoresEmRisco || [];
      },
      error: (err) => {
        // Trate erros de permissão ou conexão
        this.metricas = { ativos: 0, bemEstarGeral: 0, altoRisco: 0, altoRiscoPercent: 0 };
        this.colaboradores = [];
        this.departamentos = [];
        this.colaboradoresEmRisco = [];
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
}
