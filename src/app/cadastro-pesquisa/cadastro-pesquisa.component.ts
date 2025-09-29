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

  // Banner de feedback
  bannerMsg: string | null = null;
  bannerTipo: 'sucesso' | 'erro' = 'sucesso';
  private bannerTimer: any = null;

  // Conjuntos para impedir duplicação
  private addedIds = new Set<number>();
  private addedTexts = new Set<string>();

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('body-modal-open'));
    }
    this.carregarBanco();
  }

  closeImportModal() {
    this.showImportModal = false;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('body-lock');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('body-modal-close'));
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
    const base = (res?.perguntas || []).map((p: any) => ({ ...p, tipoResposta: 'quantitativa', obrigatoria: true }));
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
        // popular caches iniciais
        this.rebuildCaches();
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
          this.rebuildCaches();
          setTimeout(()=> this.sucesso = false, 3000);
        },
        error: () => this.erro = 'Erro ao cadastrar pesquisa.',
        complete: () => this.carregando = false,
      });
  }

  removerPergunta(idx: number) {
  if (this.tipo === 'pulso' && idx === 0) { return; }
  this.perguntasSelecionadas.splice(idx,1);
  // Recalcula caches para permitir re-adicionar mesma pergunta depois
  this.rebuildCaches();
  }

  restaurarPadrao() {
    this.perguntasSelecionadas = [...this.perguntasPadrao];
    this.rebuildCaches();
  }

  addPerguntaCustom() {
    const texto = this.novaPerguntaTexto.trim();
    if (!texto || texto.length < 3) return;
    const isQuant = this.novaPerguntaTipoResposta === 'quantitativa';
  const opcoes = isQuant ? (this.tipo === 'clima' ? this.escalaPadraoClima : this.escalaPadraoPulso) : [];
    const base = { texto, opcoes, obrigatoria: true, tipoResposta: this.novaPerguntaTipoResposta } as any;

    if (this.isDuplicate(base)) {
      this.showBanner('Pergunta já adicionada.', 'erro');
      return;
    }
    if (this.salvarNoBanco) {
      this.questionsService.create({ texto, descricaoBusca: texto, modalidade: this.tipo as any, tipoResposta: this.novaPerguntaTipoResposta }).subscribe({
        next: (q) => {
          const obj = { ...base, questionId: q?.id };
          this.perguntasSelecionadas.push(obj);
          this.registerInCaches(obj);
          this.carregarBanco(false);
          this.showBanner('Pergunta adicionada.', 'sucesso');
        },
        error: () => {
          // mesmo se falhar no banco, ainda adiciona à pesquisa
          this.perguntasSelecionadas.push(base);
          this.registerInCaches(base);
          this.showBanner('Pergunta adicionada (não salva no banco).', 'sucesso');
        }
      });
    } else {
      this.perguntasSelecionadas.push(base);
      this.registerInCaches(base);
      this.showBanner('Pergunta adicionada.', 'sucesso');
    }
    this.novaPerguntaTexto = '';
  }

  carregarBanco(reset = true) {
    this.carregandoBanco = true;
    const params: any = { modalidade: this.tipo };
    if (this.filtroTipoBanco !== 'todas') params.tipo = this.filtroTipoBanco;
    this.questionsService.list(params).subscribe({
      next: (rows) => {
        // Ignora perguntas inativas para importação (ativo === false)
        const list = (rows || []).filter((q: any) => q?.ativo !== false);
        this.bancoPerguntas = list;
        this.carregandoBanco = false;
      },
      error: () => { this.bancoPerguntas = []; this.carregandoBanco = false; }
    });
  }

  importarDaBase(q: any) {
    // Monta pergunta compatível com a pesquisa atual, inferindo opções se quantitativa
    const isQuant = q?.tipoResposta === 'quantitativa';
  const opcoes = isQuant ? (this.tipo === 'clima' ? this.escalaPadraoClima : this.escalaPadraoPulso) : [];
  const obj = { texto: q.texto, opcoes, obrigatoria: true, questionId: q.id, tipoResposta: q.tipoResposta };
  if (this.isDuplicate(obj)) {
    this.showBanner('Pergunta já adicionada.', 'erro');
    return;
  }
  this.perguntasSelecionadas.push(obj);
  this.registerInCaches(obj);
  this.showBanner('Pergunta importada.', 'sucesso');
  }

  // ----- Duplicidade & Banner Helpers -----
  private normalize(t: string) { return (t||'').toLowerCase().replace(/\s+/g,' ').trim(); }
  private isDuplicate(p: any): boolean {
    if (p.questionId && this.addedIds.has(p.questionId)) return true;
    const n = this.normalize(p.texto);
    return this.addedTexts.has(n);
  }
  private registerInCaches(p: any) {
    if (p.questionId) this.addedIds.add(p.questionId);
    this.addedTexts.add(this.normalize(p.texto));
  }
  private rebuildCaches() {
    this.addedIds.clear();
    this.addedTexts.clear();
    this.perguntasSelecionadas.forEach(p => this.registerInCaches(p));
  }
  private showBanner(msg: string, tipo: 'sucesso'|'erro') {
    this.bannerMsg = msg;
    this.bannerTipo = tipo;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(()=> { this.bannerMsg = null; }, 2500);
  }
  fecharBanner() {
    this.bannerMsg = null;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
  }
}
