import { Component, OnInit } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para usar [(ngModel)]
import { DiaryService } from '../services/diary.service'; // Serviço para integração com o back-end
import { Router, ActivatedRoute } from '@angular/router'; // Importando o Router para navegação
import { DetalheModalComponent } from '../shared/detalhe-modal.component';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { EssThermometerComponent } from '../ess-thermometer/ess-thermometer.component';


@Component({
  selector: 'app-diario',
  standalone: true,
  imports: [MenuComponent, CommonModule, FormsModule, DetalheModalComponent, NgChartsModule, EssThermometerComponent],
  templateUrl: './diario.component.html',
  styleUrls: ['./diario.component.css'],
})
export class DiarioComponent implements OnInit {
  // Propriedades para capturar os dados do formulário
  // Inicializa a data com a data local correta (yyyy-MM-dd)
  data: string = (() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  })();
  emocao: string = '';
  descricao: string = '';
  pesquisa: string = '';
  entradas: any[] = [];
  ess: number = 0; // Valor inicial do ESS, pode ser dinâmico depois

  reasons = [
    { id: 1, nome: 'Trabalho' },
    { id: 2, nome: 'Família' },
    { id: 3, nome: 'Relacionamento' },
    { id: 4, nome: 'Estudos' },
    { id: 5, nome: 'Saúde' },
    { id: 6, nome: 'Financeiro' },
    { id: 7, nome: 'Amizades' },
    { id: 8, nome: 'Outro' },
    // Adicione aqui os motivos reais do seu seed
  ];
  reasonIdSelecionado: number | null = null;

  ansiedadeLareais = [
    {
      id: 1,
      titulo: 'Exercícios rápidos para fazer na mesa de trabalho',
      tipo: 'video',
      conteudo: 'https://www.youtube.com/embed/1nZEdqcGVzo', // Link embed correto
      descricao:
        'Vídeo demonstrando exercícios simples que ajudam a aliviar a tensão e melhorar o bem-estar durante o expediente. Assista e pratique junto!',
      categoria: 'Bem-estar',
      duracao: '7 min',
      icone: 'video',
    },
    {
      id: 2,
      titulo: 'Ansiedade no trabalho',
      tipo: 'texto',
      conteudo:
        'A ansiedade no trabalho é comum e pode ser causada por prazos, cobranças ou reuniões importantes. Técnicas de respiração, pausas curtas e organização das tarefas ajudam a controlar os sintomas. Se persistir, procure apoio profissional.',
      descricao:
        'Dicas práticas para lidar com ansiedade em situações profissionais.',
      categoria: 'Ansiedade',
      duracao: '',
      icone: 'texto',
    },
    {
      id: 3,
      titulo: 'Crise de ansiedade',
      tipo: 'audio',
      conteudo: 'assets/audios/ansiedade-crise.mp3',
      descricao:
        'Áudio de um relato real sobre uma crise de ansiedade e estratégias para superá-la.',
      categoria: 'Ansiedade',
      duracao: '2 min',
      icone: 'audio',
    },
  ];
  detalheSelecionado: any = null;

  // Dados para o gráfico de barras
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Emoções' }],
};
  barChartType: ChartType = 'bar';
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true }, // Exibe a legenda das emoções
      title: { display: true, text: 'Histórico de Emoções' },
      tooltip: {
        callbacks: {
          title: (items) => {
            // Mostra a data no tooltip
            if (items.length > 0) {
              return items[0].label || '';
            }
            return '';
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
          display: false, // Esconde as datas do eixo X
        },
      },
      y: {
        title: { display: true, text: 'Quantidade' },
      },
    },
  };

  // Insights
  emocaoMaisFrequente: string = '-';
  nivelEnergia: string = '-';
  nivelEstresse: string = '-';
  filtroGrafico: 'semana' | 'mes' | 'ano' = 'semana';

  // Mapa de cores fixas para cada emoção
  private corEmocao: { [emocao: string]: string } = {
    'triste': '#2196f3',      // azul
    'frustrado': '#f44336',  // vermelho
    'neutro': '#9e9e9e',     // cinza
    'tranquilo': '#4caf50',  // verde
    'realizado': '#ffd600',  // amarelo
    'Sem emoção': '#bdbdbd'  // cinza claro
  };

  private diarioRespondidoHoje = false;

  constructor(private diaryService: DiaryService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const preload = this.route.snapshot.data['preload'];
    if (preload) {
      this.ess = preload.ess.ess ?? 0;
      this.barChartData = {
        labels: preload.grafico.labels,
        datasets: preload.grafico.datasets.map((ds: any) => ({
          ...ds,
          backgroundColor: this.corEmocao[ds.label] || '#bdbdbd',
          borderColor: this.corEmocao[ds.label] || '#bdbdbd',
          borderWidth: 1,
        }))
      };
    }
    // Verifica se já respondeu o diário hoje ao carregar a tela
    const token = localStorage.getItem('token');
    if (token) {
      this.diaryService.hasEntryToday(token).subscribe({
        next: (res) => {
          this.diarioRespondidoHoje = !!res.hasEntry;
        },
        error: () => {
          this.diarioRespondidoHoje = false;
        }
      });
      // Busca o ESS individual do usuário
      this.diaryService.getUserEss(token).subscribe({
        next: (res) => {
          this.ess = res.ess ?? 0;
        },
        error: () => {
          this.ess = 0;
        }
      });
    }
    // Garantir que o array reasons esteja inicializado corretamente
    this.reasons = [
      { id: 1, nome: 'Trabalho' },
      { id: 2, nome: 'Família' },
      { id: 3, nome: 'Relacionamento' },
      { id: 4, nome: 'Estudos' },
      { id: 5, nome: 'Saúde' },
      { id: 6, nome: 'Financeiro' },
      { id: 7, nome: 'Amizades' },
      { id: 8, nome: 'Outro' },
    ];

    console.log('Array reasons inicializado:', this.reasons);

    this.carregarEntradas();
    this.carregarInsights();
    this.carregarGrafico();
  }

  onSubmit(): void {
    const novaEntrada = {
      date: this.data,
      emotion: this.emocao,
      description: this.descricao,
      reasonIds: this.reasonIdSelecionado ? [this.reasonIdSelecionado] : [],
    };

    const token = localStorage.getItem('token');

    if (!token) {
      if (typeof window !== 'undefined') {
        alert('Você precisa estar logado para criar uma entrada.');
      }
      return;
    }

    this.diaryService.createDiaryEntry(novaEntrada, token).subscribe({
      next: () => {
        if (typeof window !== 'undefined') {
          alert('Entrada criada com sucesso!');
        }
        this.diarioRespondidoHoje = true;
        this.carregarEntradas();
        // Atualiza ESS e gráfico imediatamente após nova entrada
        this.diaryService.getUserEss(token).subscribe({
          next: (res) => { this.ess = res.ess ?? 0; },
          error: () => { this.ess = 0; }
        });
        this.carregarGrafico();
        this.resetarFormulario();
      },
      error: (err) => {
        console.error('Erro ao criar entrada:', err);
        const msg =
          err?.error?.message ||
          err?.message ||
          'Erro ao criar entrada. Tente novamente.';
        if (typeof window !== 'undefined') {
          alert('Erro ao criar entrada: ' + JSON.stringify(msg));
        }
      },
    });
  }

  carregarEntradas(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof window !== 'undefined') {
        alert('Você precisa estar logado para visualizar o diário.');
      }
      return;
    }
    this.diaryService.getDiaryEntries(token).subscribe({
      next: (data) => {
        this.entradas = data;
      },
      error: (err) => {
        if (typeof window !== 'undefined') {
          alert('Erro ao carregar entradas. Tente novamente.');
        }
      },
    });
  }

  carregarInsights(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.diaryService.getDiaryInsights(token).subscribe({
      next: (data: any) => {
        this.emocaoMaisFrequente = data.emocaoMaisFrequente;
        this.nivelEnergia = data.nivelEnergia;
        this.nivelEstresse = data.nivelEstresse;
      },
      error: () => {
        this.emocaoMaisFrequente = '-';
        this.nivelEnergia = '-';
        this.nivelEstresse = '-';
      }
    });
  }

  carregarGrafico(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.diaryService.getDiaryGraphData(token, this.filtroGrafico).subscribe({
      next: (data: any) => {
        this.barChartData = {
          labels: data.labels,
          datasets: data.datasets.map((ds: any) => ({
            ...ds,
            backgroundColor: this.corEmocao[ds.label] || '#bdbdbd',
            borderColor: this.corEmocao[ds.label] || '#bdbdbd',
            borderWidth: 1,
          }))
        };
      },
      error: () => {
        this.barChartData = { labels: [], datasets: [] };
      }
    });
  }

  selecionarFiltroGrafico(filtro: 'semana' | 'mes' | 'ano') {
    this.filtroGrafico = filtro;
    this.carregarGrafico();
  }

  resetarFormulario(): void {
    // Sempre define a data como a data atual no formato yyyy-MM-dd
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    this.data = `${ano}-${mes}-${dia}`;
    this.emocao = '';
    this.descricao = '';
  }

  navegarHistorico(): void {
    this.router.navigate(['/historico']);
  }

  navegarHome(): void {
    this.router.navigate(['/home']);
  }

  sair(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  abrirDetalhe(item: any) {
    this.detalheSelecionado = item;
  }

  fecharDetalhe() {
    this.detalheSelecionado = null;
  }
}
