import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuComponent } from "../menu/menu.component";
import { FormsModule } from "@angular/forms";
import { DashboardService } from '../services/dashboard.service';
import { EssThermometerComponent } from '../ess-thermometer/ess-thermometer.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, MenuComponent, FormsModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;
  mensagensChat: { tipo: 'ia' | 'user', texto: string }[] = [];
  mensagemUsuario: string = '';
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
  showIA: boolean = false;
  iaMensagem: string = "Olá! Sou sua assistente de IA para análise de bem-estar dos colaboradores. Posso ajudar você a identificar riscos psicossociais, analisar tendências emocionais e sugerir ações para melhorar o clima da equipe.";
  busca: string = "";
  resultadosBusca: any[] = [];
  emotionPercentages: any[] = [];
  loadingEmotions = false;


  constructor(private dashboardService: DashboardService, private route: ActivatedRoute) {
    this.iaMensagem = "Olá! Sou sua assistente de IA para análise de bem-estar dos colaboradores. Posso ajudar você a identificar riscos psicossociais, analisar tendências emocionais e sugerir ações para melhorar o clima da equipe.";
    this.mensagensChat = [
      { tipo: 'ia', texto: this.iaMensagem }
    ];
  }


  enviarMensagem() {
    const texto = this.mensagemUsuario.trim();
    if (!texto) return;
    this.mensagensChat.push({ tipo: 'user', texto });
    this.mensagemUsuario = '';
    setTimeout(() => {
      this.mensagensChat.push({ tipo: 'ia', texto: 'No momento não estou Disponivel mas em breve estarei!' });
      setTimeout(() => this.scrollChatToBottom(), 10);
    }, 500);
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 10);
  }

  ngAfterViewInit() {
    this.scrollChatToBottom();
  }

  private scrollChatToBottom() {
    try {
      if (this.chatContainerRef && this.chatContainerRef.nativeElement) {
        this.chatContainerRef.nativeElement.scrollTop = this.chatContainerRef.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

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


  getScoreColor(): string {
    if (this.essGeral >= 80) {
      return '#38b6a5'; // verde
    } else if (this.essGeral >= 60) {
      return '#fbc02d'; // amarelo
    } else {
      return '#ff7043'; // laranja
    }
  }

  getScoreLabel(): string {
    if (this.essGeral >= 80) {
      return 'Bom';
    } else if (this.essGeral >= 60) {
      return 'Atenção';
    } else {
      return 'Crítica';
    }
  }

  getScoreDesc(): string {
    if (this.essGeral >= 80) {
      return 'O bem-estar emocional geral da empresa está bom!';
    } else if (this.essGeral >= 60) {
      return 'O bem-estar emocional da empresa requer acompanhamento.';
    } else {
      return 'A saúde emocional da empresa precisa de cuidado imediato.';
    }
  }

  getScoreDescBg(): string {
    if (this.essGeral >= 80) {
      return '#e6f9f3'; // verde claro
    } else if (this.essGeral >= 60) {
      return '#fff8e1'; // amarelo claro
    } else {
      return '#fff3e6'; // laranja claro
    }
  }

  getScoreDescColor(): string {
    if (this.essGeral >= 80) {
      return '#38b6a5';
    } else if (this.essGeral >= 60) {
      return '#fbc02d';
    } else {
      return '#ff7043';
    }
  }
}
