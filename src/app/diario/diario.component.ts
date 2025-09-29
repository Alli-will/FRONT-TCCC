import { Component, OnInit } from "@angular/core";
import { MenuComponent } from "../menu/menu.component";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms"; // Para usar [(ngModel)]
import { DiaryService } from "../services/diary.service"; // Serviço para integração com o back-end
import { Router, ActivatedRoute } from "@angular/router"; // Importando o Router para navegação
import { DetalheModalComponent } from "../shared/detalhe-modal.component";
import { ChartConfiguration, ChartType } from "chart.js";
import { NgChartsModule } from "ng2-charts";
import { EssThermometerComponent } from "../ess-thermometer/ess-thermometer.component";
import { LoadingIndicatorComponent } from "../loading-indicator.component";

@Component({
  selector: "app-diario",
  standalone: true,
  imports: [
    MenuComponent,
    CommonModule,
    FormsModule,
    NgChartsModule,
    LoadingIndicatorComponent,
    DetalheModalComponent,
  ],
  templateUrl: "./diario.component.html",
  styleUrls: ["./diario.component.css"],
})
export class DiarioComponent implements OnInit {
  data: string = (() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  })();
  emocao: number | null = null;
  descricao: string = "";
  pesquisa: string = "";
  entradas: any[] = [];
  ess: number = 0;
  isLoading: boolean = true;

  reasons = [
    { id: 1, nome: "Trabalho" },
    { id: 2, nome: "Família" },
    { id: 3, nome: "Relacionamento" },
    { id: 4, nome: "Estudos" },
    { id: 5, nome: "Saúde" },
    { id: 6, nome: "Financeiro" },
    { id: 7, nome: "Amizades" },
    { id: 8, nome: "Outro" },
  ];
  modalRazaoAberto = false;
  reasonIdSelecionado: number | null = null;

  abrirModalRazao() {
    if (!this.emocao) {
      alert("Por favor, selecione um emoji para o seu sentimento.");
      return;
    }
    if (!this.descricao || this.descricao.trim().length < 1) {
      alert("Por favor, preencha a descrição do seu sentimento.");
      return;
    }
    this.modalRazaoAberto = true;
    this.reasonIdSelecionado = null;
  }

  fecharModalRazao() {
    this.modalRazaoAberto = false;
  }

  selecionarRazao(id: number) {
    this.reasonIdSelecionado = id;
  }

  confirmarRazao() {
    this.modalRazaoAberto = false;
    this.onSubmit();
  }

  ansiedadeLareais = [
    {
      id: 1,
      titulo: "Exercícios rápidos para fazer na mesa de trabalho",
      tipo: "video",
      conteudo: "https://www.youtube.com/embed/1nZEdqcGVzo",
      descricao:
        "Vídeo demonstrando exercícios simples que ajudam a aliviar a tensão e melhorar o bem-estar durante o expediente. Assista e pratique junto!",
      categoria: "Bem-estar",
      duracao: "7 min",
      icone: "video",
    },
    {
      id: 2,
      titulo: "Ansiedade no trabalho",
      tipo: "texto",
      conteudo:
        "A ansiedade no trabalho é comum e pode ser causada por prazos, cobranças ou reuniões importantes. Técnicas de respiração, pausas curtas e organização das tarefas ajudam a controlar os sintomas. Se persistir, procure apoio profissional.",
      descricao: "Dicas práticas para lidar com ansiedade em situações profissionais.",
      categoria: "Ansiedade",
      duracao: "",
      icone: "texto",
    },
    {
      id: 3,
      titulo: "Crise de ansiedade",
      tipo: "audio",
      conteudo: "assets/audios/ansiedade-crise.mp3",
      descricao:
        "Áudio de um relato real sobre uma crise de ansiedade e estratégias para superá-la.",
      categoria: "Ansiedade",
      duracao: "2 min",
      icone: "audio",
    },
  ];
  detalheSelecionado: any = null;

  barChartData: ChartConfiguration<"bar">["data"] = {
    labels: [],
    datasets: [{ data: [], label: "Emoções" }],
  };
  barChartType: ChartType = "bar";
  barChartOptions: ChartConfiguration<"bar">["options"] = {
    responsive: true,
    plugins: {
      legend: { display: true }, // Exibe a legenda das emoções
      title: { display: true, text: "Histórico de Emoções" },
      tooltip: {
        callbacks: {
          title: (items) => {
            // Mostra a data no tooltip no formato brasileiro
            if (items.length > 0 && items[0].label) {
              const partes = items[0].label.split("-");
              if (partes.length === 3) {
                // formato AAAA-MM-DD
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
              } else if (partes.length === 1 && items[0].label.length === 4) {
                // formato apenas ano
                return items[0].label;
              }
            }
            return "";
          },
          label: (item) => {
            // Mostra a emoção e o valor
            return `${item.dataset.label}: ${item.formattedValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: function (value, index, values) {
            let label = value;
            if (typeof this.getLabelForValue === "function") {
              label = this.getLabelForValue(Number(value));
            }
            if (typeof label === "string" && label.includes("-")) {
              const partes = label.split("-");
              if (partes.length === 3) {
                // formato AAAA-MM-DD
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
              } else if (partes.length === 1 && label.length === 4) {
                // formato apenas ano
                return label;
              }
            }
            // Se não for data, retorna o label original
            return label;
          },
          display: true,
        },
      },
      y: {
        title: { display: true, text: "Quantidade" },
      },
    },
  };

  // Insights
  emocaoMaisFrequente: string = "-";
  nivelEnergia: string = "-";
  nivelEstresse: string = "-";
  filtroGrafico: "semana" | "mes" | "ano" = "semana";

  // Mapa de cores fixas para cada emoção
  private corEmocao: { [emocao: string]: string } = {
    "Muito mal": "#2196f3", // azul (triste)
    Mal: "#f44336", // vermelho (frustrado)
    Neutro: "#9e9e9e", // cinza
    Bem: "#4caf50", // verde (tranquilo)
    "Muito bem": "#ffd600", // amarelo (realizado)
    "Sem emoção": "#bdbdbd", // cinza claro
  };

  private diarioRespondidoHoje = false;

  // propriedades para o dashboard emocional
  scorePercent: number = 0;
  mediaPeriodo: number = 0;
  melhorDia: number = 0;
  lineChartData: any[] = [];
  lineChartLabels: string[] = [];
  lineChartOptions: any = {
    responsive: true,
    spanGaps: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { min: 1, max: 5, ticks: { stepSize: 1 }, title: { display: true, text: "" } },
    },
  };
  lineChartType: any = "line";

  private emocaoMap: { [key: number]: string } = {
    1: "Muito mal",
    2: "Mal",
    3: "Neutro",
    4: "Bem",
    5: "Muito bem",
  };

  constructor(
    private diaryService: DiaryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const preload = this.route.snapshot.data["preload"];
    if (preload) {
      this.ess = preload.ess.ess ?? 0;
      this.scorePercent = preload.ess.ess ?? 0;
      this.isLoading = false;
      this.barChartData = {
        labels: preload.grafico.labels,
        datasets: preload.grafico.datasets.map((ds: any) => ({
          ...ds,
          backgroundColor: this.corEmocao[ds.label] || "#bdbdbd",
          borderColor: this.corEmocao[ds.label] || "#bdbdbd",
          borderWidth: 1,
        })),
      };
    }
    // Verifica se já respondeu o diário hoje ao carregar a tela
    const token = localStorage.getItem("token");
    if (token) {
      this.diaryService.hasEntryToday(token).subscribe({
        next: (res) => {
          this.diarioRespondidoHoje = !!res.hasEntry;
        },
        error: () => {
          this.diarioRespondidoHoje = false;
        },
      });
      // Busca o ESS individual do usuário e usa para o scorePercent
      this.diaryService.getUserEss(token).subscribe({
        next: (res) => {
          this.ess = res.ess ?? 0;
          this.scorePercent = res.ess ?? 0;
          this.isLoading = false;
        },
        error: () => {
          this.ess = 0;
          this.scorePercent = 0;
          this.isLoading = false;
        },
      });
    } else {
      this.isLoading = false;
    }
    // Garantir que o array reasons esteja inicializado corretamente
    this.reasons = [
      { id: 1, nome: "Trabalho" },
      { id: 2, nome: "Família" },
      { id: 3, nome: "Relacionamento" },
      { id: 4, nome: "Estudos" },
      { id: 5, nome: "Saúde" },
      { id: 6, nome: "Financeiro" },
      { id: 7, nome: "Amizades" },
      { id: 8, nome: "Outro" },
    ];

    this.carregarEntradas();
    this.carregarInsights();
    this.carregarGrafico();
    // Não chama mais carregarDashboardEmocional para não sobrescrever scorePercent
  }

  onSubmit(): void {
    const novaEntrada = {
      date: this.data,
      emotion: this.emocao ? this.emocaoMap[this.emocao] : "",
      description: this.descricao,
      reasonIds: this.reasonIdSelecionado ? [this.reasonIdSelecionado] : [],
    };

    const token = localStorage.getItem("token");

    if (!token) {
      if (typeof window !== "undefined") {
        alert("Você precisa estar logado para criar uma entrada.");
      }
      return;
    }

    this.diaryService.createDiaryEntry(novaEntrada, token).subscribe({
      next: () => {
        if (typeof window !== "undefined") {
          alert("Entrada criada com sucesso!");
        }
        this.diarioRespondidoHoje = true;
        this.carregarEntradas();
        // Atualiza ESS e gráfico imediatamente após nova entrada
        this.diaryService.getUserEss(token).subscribe({
          next: (res) => {
            this.ess = res.ess ?? 0;
            this.scorePercent = res.ess ?? 0;
          },
          error: () => {
            this.ess = 0;
            this.scorePercent = 0;
          },
        });
        this.carregarGrafico();
        this.resetarFormulario();
      },
      error: (err) => {
        console.error("Erro ao criar entrada:", err);
        const msg =
          err?.error?.message || err?.message || "Erro ao criar entrada. Tente novamente.";
        if (typeof window !== "undefined") {
          alert("Erro ao criar entrada: " + JSON.stringify(msg));
        }
      },
    });
  }

  carregarEntradas(): void {
    const token = localStorage.getItem("token");
    if (!token) {
      if (typeof window !== "undefined") {
        alert("Você precisa estar logado para visualizar o diário.");
      }
      return;
    }
    this.diaryService.getDiaryEntries(token).subscribe({
      next: (data) => {
        this.entradas = data;
      },
      error: (err) => {
        if (typeof window !== "undefined") {
          alert("Erro ao carregar entradas. Tente novamente.");
        }
      },
    });
  }

  carregarInsights(): void {
    const token = localStorage.getItem("token");
    if (!token) return;
    this.diaryService.getDiaryInsights(token).subscribe({
      next: (data: any) => {
        this.emocaoMaisFrequente = data.emocaoMaisFrequente;
        this.nivelEnergia = data.nivelEnergia;
        this.nivelEstresse = data.nivelEstresse;
      },
      error: () => {
        this.emocaoMaisFrequente = "-";
        this.nivelEnergia = "-";
        this.nivelEstresse = "-";
      },
    });
  }

  carregarGrafico(): void {
    const token = localStorage.getItem("token");
    if (!token) return;
    this.diaryService.getDiaryGraphData(token, this.filtroGrafico).subscribe({
      next: (data: any) => {
        // Filtra apenas datas que têm valor (diário registrado)
        const filteredLabels: string[] = [];
        const filteredLineData: any[] = [];
        const labels = data.lineLabels || data.labels;
        const lineData = data.lineData || [];
        labels.forEach((label: string, idx: number) => {
          if (lineData[idx] != null) {
            filteredLabels.push(label);
            filteredLineData.push(lineData[idx]);
          }
        });
        this.lineChartLabels = filteredLabels;
        this.lineChartData = [
          {
            data: filteredLineData,
            label: "Humor diário",
            fill: false,
            borderColor: "#38b6a5",
            tension: 0.3,
          },
        ];
        // Preenche o gráfico de barras (quantidade por emoção)
        this.barChartData = {
          labels: data.labels,
          datasets: data.datasets.map((ds: any) => ({
            ...ds,
            backgroundColor: this.corEmocao[ds.label] || "#bdbdbd",
            borderColor: this.corEmocao[ds.label] || "#bdbdbd",
            borderWidth: 1,
          })),
        };
        // Atualiza média e melhor dia
        this.mediaPeriodo = data.mediaPeriodo || 0;
        this.melhorDia = data.melhorDia || 0;
      },
      error: () => {
        this.barChartData = { labels: [], datasets: [] };
        this.lineChartLabels = [];
        this.lineChartData = [];
      },
    });
  }

  selecionarFiltroGrafico(filtro: "semana" | "mes" | "ano") {
    this.filtroGrafico = filtro;
    this.carregarGrafico();
  }

  resetarFormulario(): void {
    // Sempre define a data como a data atual no formato yyyy-MM-dd
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    this.data = `${ano}-${mes}-${dia}`;
    this.emocao = null;
    this.descricao = "";
  }

  navegarHistorico(): void {
    this.router.navigate(["/historico"]);
  }

  navegarHome(): void {
    this.router.navigate(["/home"]);
  }

  sair(): void {
    localStorage.removeItem("token");
    this.router.navigate(["/login"]);
  }

  abrirDetalhe(item: any) {
    this.detalheSelecionado = item;
  }

  fecharDetalhe() {
    this.detalheSelecionado = null;
  }

  getScoreColor(nota?: number): string {
    if (typeof nota === "number") {
      if (nota >= 4.5) return "#009e7f"; // verde escuro
      if (nota >= 3.5) return "#38b6a5"; // verde
      if (nota >= 2.5) return "#fbc02d"; // amarelo
      return "#e74c3c"; // vermelho
    }
    // fallback para scorePercent
    if (this.scorePercent >= 80) {
      return "#38b6a5"; // verde
    } else if (this.scorePercent >= 60) {
      return "#fbc02d"; // amarelo
    } else {
      return "#ff7043"; // laranja
    }
  }

  getScoreLabel(): string {
    if (this.scorePercent >= 80) {
      return "Bom";
    } else if (this.scorePercent >= 60) {
      return "Atenção";
    } else {
      return "Crítica";
    }
  }

  getScoreDesc(): string {
    if (this.scorePercent >= 80) {
      return "Sua saúde emocional está bem!";
    } else if (this.scorePercent >= 60) {
      return "Fique atento à sua saúde emocional.";
    } else {
      return "Sua saúde emocional precisa de cuidado.";
    }
  }

  getScoreDescBg(): string {
    if (this.scorePercent >= 80) {
      return "#e6f9f3"; // verde claro
    } else if (this.scorePercent >= 60) {
      return "#fff8e1"; // amarelo claro
    } else {
      return "#fff3e6"; // laranja claro
    }
  }

  getScoreDescColor(): string {
    if (this.scorePercent >= 80) {
      return "#38b6a5";
    } else if (this.scorePercent >= 60) {
      return "#fbc02d";
    } else {
      return "#ff7043";
    }
  }
}
