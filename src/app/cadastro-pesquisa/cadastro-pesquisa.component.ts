import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search.service';
import { QuestionService } from '../services/question.service';

@Component({
  selector: 'app-cadastro-pesquisa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-pesquisa.component.html',
  styleUrls: ['./cadastro-pesquisa.component.css']
})
export class CadastroPesquisaComponent implements OnDestroy {
  @Output() criado = new EventEmitter<void>();
  titulo = '';
  tipo = 'pulso';
  sucesso = false;
  erro = '';
  carregando = false;
  perguntasPadrao: any[] = [];
  perguntasSelecionadas: any[] = [];
  carregandoPerguntas = true;
  // campos para nova pergunta customizada
  novaPerguntaTexto = '';
  novaPerguntaTipoResposta: 'quantitativa' | 'qualitativa' = 'quantitativa';
  salvarNoBanco = true;
  escalaPadraoPulso: number[] = [0,1,2,3,4,5,6,7,8,9,10];
  escalaPadraoClima: number[] = [1,2,3,4,5];

  // Banco de perguntas (importação)
  bancoPerguntas: any[] = [];
  carregandoBanco = false;
  filtroTipoBanco: 'todas'|'quantitativa'|'qualitativa' = 'todas';
  showImportModal = false;

  constructor(private searchService: SearchService, private questionsService: QuestionService) {}

  ngOnInit() {
    this.carregarPadrao();
  }

  openImportModal() {
    this.showImportModal = true;
    // lock background scroll
    if (typeof document !== 'undefined') {
      document.body.classList.add('body-lock');
    }
    this.carregarBanco();
  }

  closeImportModal() {
    this.showImportModal = false;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('body-lock');
    }
  }

  ngOnDestroy(): void {
    // safety: remove lock on destroy
    if (typeof document !== 'undefined') {
      document.body.classList.remove('body-lock');
    }
  }

  onChangeTipo() {
    this.carregarPadrao();
  }

  private carregarPadrao() {
    this.carregandoPerguntas = true;
    this.searchService.getDefaultQuestions(this.tipo as any).subscribe({
      next: (res) => {
    const base = (res?.perguntas || []).map((p: any) => ({ ...p, tipoResposta: 'quantitativa' }));
    // Para pesquisas de Pulso, adiciona uma pergunta qualitativa padrão após a NPS
    if (this.tipo === 'pulso' && base.length > 0) {
      const followUp = {
        texto: 'Com base na sua resposta anterior, qual é o principal motivo da sua nota?',
  obrigatoria: true,
  tipoResposta: 'qualitativa',
  opcoes: []
      } as any;
      this.perguntasPadrao = [base[0], followUp, ...base.slice(1)];
    } else {
      this.perguntasPadrao = base;
    }
    this.perguntasSelecionadas = [...this.perguntasPadrao];
        this.carregandoPerguntas = false;
      },
      error: () => { this.carregandoPerguntas = false; }
    });
  this.carregarBanco();
  }

  cadastrar() {
    if (this.carregando) return;
    this.sucesso = false;
    this.erro = '';
    this.carregando = true;
  // Backend DTO aceita apenas: texto (string), opcoes (array), obrigatoria (boolean opcional)
  // Para qualitativas, envie opcoes como [] para satisfazer a validação (@IsArray)
  const perguntas = this.perguntasSelecionadas.map(p => ({
    texto: p.texto,
    opcoes: Array.isArray(p.opcoes) ? p.opcoes : [],
    obrigatoria: !!p.obrigatoria,
  }));
    this.searchService.createSearch({ titulo: this.titulo.trim(), tipo: this.tipo, perguntas })
      .subscribe({
        next: () => {
          this.sucesso = true;
          this.criado.emit();
          this.titulo = '';
          this.tipo = 'pulso';
          this.perguntasSelecionadas = [...this.perguntasPadrao];
          setTimeout(()=> this.sucesso = false, 3000);
        },
        error: () => this.erro = 'Erro ao cadastrar pesquisa.',
        complete: () => this.carregando = false,
      });
  }

  removerPergunta(idx: number) {
  if (this.tipo === 'pulso' && idx === 0) { return; }
  this.perguntasSelecionadas.splice(idx,1);
  }

  restaurarPadrao() {
    this.perguntasSelecionadas = [...this.perguntasPadrao];
  }

  addPerguntaCustom() {
    const texto = this.novaPerguntaTexto.trim();
    if (!texto || texto.length < 3) return;
    const isQuant = this.novaPerguntaTipoResposta === 'quantitativa';
  const opcoes = isQuant ? (this.tipo === 'clima' ? this.escalaPadraoClima : this.escalaPadraoPulso) : [];
    const base = { texto, opcoes, obrigatoria: true, tipoResposta: this.novaPerguntaTipoResposta } as any;
    if (this.salvarNoBanco) {
      this.questionsService.create({ texto, descricaoBusca: texto, modalidade: this.tipo as any, tipoResposta: this.novaPerguntaTipoResposta }).subscribe({
        next: (q) => {
          this.perguntasSelecionadas.push({ ...base, questionId: q?.id });
          this.carregarBanco(false);
        },
        error: () => {
          // mesmo se falhar no banco, ainda adiciona à pesquisa
          this.perguntasSelecionadas.push(base);
        }
      });
    } else {
      this.perguntasSelecionadas.push(base);
    }
    this.novaPerguntaTexto = '';
  }

  carregarBanco(reset = true) {
    this.carregandoBanco = true;
    const params: any = { modalidade: this.tipo };
    if (this.filtroTipoBanco !== 'todas') params.tipo = this.filtroTipoBanco;
    this.questionsService.list(params).subscribe({
      next: (rows) => { this.bancoPerguntas = rows || []; this.carregandoBanco = false; },
      error: () => { this.bancoPerguntas = []; this.carregandoBanco = false; }
    });
  }

  importarDaBase(q: any) {
    // Monta pergunta compatível com a pesquisa atual, inferindo opções se quantitativa
    const isQuant = q?.tipoResposta === 'quantitativa';
  const opcoes = isQuant ? (this.tipo === 'clima' ? this.escalaPadraoClima : this.escalaPadraoPulso) : [];
  this.perguntasSelecionadas.push({ texto: q.texto, opcoes, obrigatoria: true, questionId: q.id, tipoResposta: q.tipoResposta });
  }
}
