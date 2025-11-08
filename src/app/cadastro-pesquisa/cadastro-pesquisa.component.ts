import {
  Component,
  EventEmitter,
  Output,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SearchService } from "../services/search.service";
import { QuestionService } from "../services/question.service";
import { DepartmentService } from "../services/department.service";
import { LoadingIndicatorComponent } from "../loading-indicator.component";

@Component({
  selector: "app-cadastro-pesquisa",
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingIndicatorComponent],
  templateUrl: "./cadastro-pesquisa.component.html",
  styleUrls: ["./cadastro-pesquisa.component.css"],
})
export class CadastroPesquisaComponent implements OnDestroy, OnChanges {
  @Input() editarDe: any | null = null;
  @Output() criado = new EventEmitter<{ tipo: "cadastrada" | "alterada" }>();
  titulo = "";
  tipo = "pulso";
  sucesso = false;
  erro = "";
  carregando = false;
  perguntasPadrao: any[] = [];
  perguntasSelecionadas: any[] = [];
  carregandoPerguntas = true;
  // campos para nova pergunta customizada
  novaPerguntaTexto = "";
  novaPerguntaTipoResposta: "quantitativa" | "qualitativa" = "quantitativa";
  salvarNoBanco = true;
  escalaPadraoPulso: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  escalaPadraoClima: number[] = [1, 2, 3, 4, 5];

  // Banco de perguntas (importação)
  bancoPerguntas: any[] = [];
  carregandoBanco = false;
  filtroTipoBanco: "todas" | "quantitativa" | "qualitativa" = "todas";
  showImportModal = false;

  // Banner de feedback
  bannerMsg: string | null = null;
  bannerTipo: "sucesso" | "erro" = "sucesso";
  private bannerTimer: any = null;

  // Conjuntos para impedir duplicação
  private addedIds = new Set<number>();
  private addedTexts = new Set<string>();

  // Alcance da pesquisa: todos os setores ou múltiplos setores selecionados
  alcance: "todos" | "setores" = "todos";
  departamentos: any[] = [];
  // Seleção múltipla
  selectedDepartmentIds: number[] = [];
  emEdicao = false;
  editId: number | null = null;
  // Loading overlay control
  loadingOverlay = false;
  private depsLoaded = false;
  private questionsLoaded = false;
  // Drag & drop state
  dragIndex: number | null = null;
  dragOverIndex: number | null = null;
  dragOverBefore: boolean | null = null; // true = inserir antes, false = depois

  constructor(
    private searchService: SearchService,
    private questionsService: QuestionService,
    private deptService: DepartmentService
  ) {}

  ngOnInit() {
    // Ativa overlay também para criação: some quando perguntas e departamentos carregarem
    this.loadingOverlay = true;
    this.questionsLoaded = false;
    this.depsLoaded = false;
    this.carregarPadrao();
    // carrega departamentos para seleção de escopo (com cache no service)
    this.deptService.getAll().subscribe({
      next: (rows) => {
        this.departamentos = rows || [];
        this.depsLoaded = true;
        this.tryHideOverlay();
      },
      error: () => {
        this.departamentos = [];
        this.depsLoaded = true;
        this.tryHideOverlay();
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["editarDe"]) {
      const s = this.editarDe;
      if (s && s.id) {
        this.emEdicao = true;
        this.editId = s.id;
        this.titulo = s.titulo || "";
        this.tipo = s.tipo || "pulso";
        const ps = Array.isArray(s.perguntas) ? s.perguntas : [];
        this.perguntasSelecionadas = ps.map((p: any) => ({
          texto: p.texto,
          opcoes: Array.isArray(p.opcoes) ? p.opcoes : [],
          obrigatoria: p.obrigatoria !== false,
          tipoResposta: Array.isArray(p.opcoes) && p.opcoes.length ? "quantitativa" : "qualitativa",
          questionId: p.questionId,
        }));
        // Preferir departmentIds (novo); fallback para departmentId legado
        const depIds = Array.isArray((s as any).departmentIds) ? (s as any).departmentIds : [];
        if (depIds.length) {
          this.alcance = "setores";
          this.selectedDepartmentIds = depIds;
        } else if ((s as any).departmentId) {
          this.alcance = "setores";
          this.selectedDepartmentIds = [(s as any).departmentId];
        } else {
          this.alcance = "todos";
          this.selectedDepartmentIds = [];
        }
        this.rebuildCaches();
      } else {
        this.emEdicao = false;
        this.editId = null;
      }
    }
  }

  openImportModal() {
    this.showImportModal = true;
    if (typeof document !== "undefined") {
      document.body.classList.add("body-lock");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("body-modal-open"));
    }
    this.carregarBanco();
  }

  closeImportModal() {
    this.showImportModal = false;
    if (typeof document !== "undefined") {
      document.body.classList.remove("body-lock");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("body-modal-close"));
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== "undefined") {
      document.body.classList.remove("body-lock");
    }
  }

  onChangeTipo() {
    this.carregarPadrao();
  }

  private carregarPadrao() {
    this.carregandoPerguntas = true;
    this.searchService.getDefaultQuestions(this.tipo as any).subscribe({
      next: (res) => {
        const base = (res?.perguntas || []).map((p: any) => ({
          ...p,
          tipoResposta: "quantitativa",
          obrigatoria: true,
        }));
        // Para pesquisas de Pulso, adiciona uma pergunta qualitativa padrão após a NPS
        if (this.tipo === "pulso" && base.length > 0) {
          const followUp = {
            texto: "Com base na sua resposta anterior, qual é o principal motivo da sua nota?",
            obrigatoria: true,
            tipoResposta: "qualitativa",
            opcoes: [],
          } as any;
          this.perguntasPadrao = [base[0], followUp, ...base.slice(1)];
        } else {
          this.perguntasPadrao = base;
        }
        this.perguntasSelecionadas = [...this.perguntasPadrao];
        this.rebuildCaches();
        this.carregandoPerguntas = false;
        this.questionsLoaded = true;
        this.tryHideOverlay();
      },
      error: () => {
        this.carregandoPerguntas = false;
        this.questionsLoaded = true;
        this.tryHideOverlay();
      },
    });
    this.carregarBanco();
  }

  cadastrar() {
    if (this.carregando) return;
    this.sucesso = false;
    this.erro = "";
    this.carregando = true;
    if (
      this.alcance === "setores" &&
      (!Array.isArray(this.selectedDepartmentIds) || this.selectedDepartmentIds.length === 0)
    ) {
      this.carregando = false;
      // Exibe como banner temporário (2.5s) em vez de erro persistente
      this.showBanner("Selecione pelo menos um departamento para direcionar a pesquisa.", "erro");
      return;
    }
    // Backend DTO aceita apenas: texto (string), opcoes (array), obrigatoria (boolean opcional)
    // Para qualitativas, envie opcoes como [] para satisfazer a validação (@IsArray)
    const perguntas = this.perguntasSelecionadas.map((p) => ({
      texto: p.texto,
      opcoes: Array.isArray(p.opcoes) ? p.opcoes : [],
      obrigatoria: !!p.obrigatoria,
    }));
    const payload: any = { titulo: this.titulo.trim(), tipo: this.tipo, perguntas };
    // Novo: enviar departmentIds (múltiplos) ou limpar quando 'todos'
    payload.departmentIds = this.alcance === "setores" ? [...this.selectedDepartmentIds] : [];
    // Compatibilidade com backend legado: garantir departmentId nulo quando 'todos'
    payload.departmentId = this.alcance === "setores" ? null : null;
    const req$ =
      this.emEdicao && this.editId
        ? this.searchService.updateSearch(this.editId, payload)
        : this.searchService.createSearch(payload);
    req$.subscribe({
      next: () => {
        this.sucesso = true;
        const tipo = this.emEdicao ? "alterada" : "cadastrada";
        this.criado.emit({ tipo });
        this.titulo = "";
        this.tipo = "pulso";
        this.perguntasSelecionadas = [...this.perguntasPadrao];
        this.alcance = "todos";
        this.selectedDepartmentIds = [];
        this.emEdicao = false;
        this.editId = null;
        this.rebuildCaches();
        setTimeout(() => (this.sucesso = false), 3000);
      },
      error: () =>
        (this.erro = this.emEdicao ? "Erro ao atualizar pesquisa." : "Erro ao cadastrar pesquisa."),
      complete: () => (this.carregando = false),
    });
  }

  removerPergunta(idx: number) {
    // Em pesquisas de pulso, mantemos a pergunta NPS fixa na primeira posição
    if (this.tipo === "pulso" && idx === 0) return;
    this.perguntasSelecionadas.splice(idx, 1);
    // Recalcula caches para permitir re-adicionar mesma pergunta depois
    this.rebuildCaches();
  }

  moverPergunta(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= this.perguntasSelecionadas.length) return;
    // Não move a NPS da primeira posição em pesquisas de pulso
    if (this.tipo === "pulso" && (i === 0 || j === 0)) return;
    const arr = this.perguntasSelecionadas;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    // sem alterar caches, pois conteúdo não muda
  }

  // ----- Drag & Drop Reorder -----
  canDrag(index: number): boolean {
    return !(this.tipo === "pulso" && index === 0);
  }
  private normalizeDropIndex(targetIndex: number): number {
    if (this.tipo === "pulso" && targetIndex === 0) return 1;
    return targetIndex;
  }
  onDragStart(index: number, ev: DragEvent) {
    if (!this.canDrag(index)) {
      ev.preventDefault();
      return;
    }
    this.dragIndex = index;
    try {
      ev.dataTransfer?.setData("text/plain", String(index));
      if (ev.dataTransfer) ev.dataTransfer.effectAllowed = "move";
    } catch {}
  }
  onDragOver(index: number, ev: DragEvent) {
    if (this.dragIndex == null) return;
    ev.preventDefault(); // allow drop
    const norm = this.normalizeDropIndex(index);
    // Decide se a inserção será antes ou depois com base na metade do item
    let before = true;
    try {
      const el = ev.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const offsetY = ev.clientY - rect.top;
      before = offsetY < rect.height / 2;
      // Em pulso, impedir indicador "antes" na posição 0
      if (this.tipo === "pulso" && norm === 0) before = false;
    } catch {}
    this.dragOverIndex = norm;
    this.dragOverBefore = before;
    try {
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
    } catch {}
  }
  onDrop(index: number, ev: DragEvent) {
    ev.preventDefault();
    if (this.dragIndex == null) return;
    const from = this.dragIndex;
    const base = this.normalizeDropIndex(index);
    const before = this.dragOverBefore === null ? true : this.dragOverBefore;
    // Índice desejado antes de remover o item da posição original
    let desiredTo = base + (before ? 0 : 1);
    // Clamp aos limites
    if (desiredTo < 0) desiredTo = 0;
    if (desiredTo > this.perguntasSelecionadas.length)
      desiredTo = this.perguntasSelecionadas.length;
    if (desiredTo < 0 || desiredTo > this.perguntasSelecionadas.length) {
      this.onDragEnd(ev);
      return;
    }
    // Ajusta índice destino após remoção do item de origem
    if (from < desiredTo) desiredTo = desiredTo - 1;
    // Em pulso, garantir que nunca inserimos na posição 0
    if (this.tipo === "pulso" && desiredTo === 0) desiredTo = 1;
    if (from === desiredTo) {
      this.onDragEnd(ev);
      return;
    }
    const arr = this.perguntasSelecionadas;
    const [item] = arr.splice(from, 1);
    arr.splice(desiredTo, 0, item);
    // caches não mudam (conteúdo igual)
    this.dragIndex = null;
    this.dragOverIndex = null;
    this.dragOverBefore = null;
  }
  onDragEnd(_ev: DragEvent) {
    this.dragIndex = null;
    this.dragOverIndex = null;
    this.dragOverBefore = null;
  }

  restaurarPadrao() {
    this.perguntasSelecionadas = [...this.perguntasPadrao];
    this.rebuildCaches();
  }

  addPerguntaCustom() {
    const texto = this.novaPerguntaTexto.trim();
    if (!texto || texto.length < 3) return;
    const isQuant = this.novaPerguntaTipoResposta === "quantitativa";
    const opcoes = isQuant
      ? this.tipo === "clima"
        ? this.escalaPadraoClima
        : this.escalaPadraoPulso
      : [];
    const base = {
      texto,
      opcoes,
      obrigatoria: true,
      tipoResposta: this.novaPerguntaTipoResposta,
    } as any;

    if (this.isDuplicate(base)) {
      this.showBanner("Pergunta já adicionada.", "erro");
      return;
    }
    if (this.salvarNoBanco) {
      this.questionsService
        .create({
          texto,
          descricaoBusca: texto,
          modalidade: this.tipo as any,
          tipoResposta: this.novaPerguntaTipoResposta,
        })
        .subscribe({
          next: (q) => {
            const obj = { ...base, questionId: q?.id };
            this.perguntasSelecionadas.push(obj);
            this.registerInCaches(obj);
            this.carregarBanco(false);
            this.showBanner("Pergunta adicionada.", "sucesso");
          },
          error: () => {
            this.perguntasSelecionadas.push(base);
            this.registerInCaches(base);
            this.showBanner("Pergunta adicionada (não salva no banco).", "sucesso");
          },
        });
    } else {
      this.perguntasSelecionadas.push(base);
      this.registerInCaches(base);
      this.showBanner("Pergunta adicionada.", "sucesso");
    }
    this.novaPerguntaTexto = "";
  }

  carregarBanco(reset = true) {
    this.carregandoBanco = true;
    const params: any = { modalidade: this.tipo };
    if (this.filtroTipoBanco !== "todas") params.tipo = this.filtroTipoBanco;
    this.questionsService.list(params).subscribe({
      next: (rows) => {
        // Ignora perguntas inativas para importação (ativo === false)
        const list = (rows || []).filter((q: any) => q?.ativo !== false);
        this.bancoPerguntas = list;
        this.carregandoBanco = false;
      },
      error: () => {
        this.bancoPerguntas = [];
        this.carregandoBanco = false;
      },
    });
  }

  importarDaBase(q: any) {
    // Monta pergunta compatível com a pesquisa atual, inferindo opções se quantitativa
    const isQuant = q?.tipoResposta === "quantitativa";
    const opcoes = isQuant
      ? this.tipo === "clima"
        ? this.escalaPadraoClima
        : this.escalaPadraoPulso
      : [];
    const obj = {
      texto: q.texto,
      opcoes,
      obrigatoria: true,
      questionId: q.id,
      tipoResposta: q.tipoResposta,
    };
    if (this.isDuplicate(obj)) {
      this.showBanner("Pergunta já adicionada.", "erro");
      return;
    }
    this.perguntasSelecionadas.push(obj);
    this.registerInCaches(obj);
    this.showBanner("Pergunta importada.", "sucesso");
  }

  // ----- Duplicidade & Banner Helpers -----
  private normalize(t: string) {
    return (t || "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  /*
   * - Se a pergunta possui questionId: só bloqueia se aquele ID já foi adicionado.
   *   (Permite perguntas diferentes do banco mesmo que o texto coincida parcialmente.)
   */
  private isDuplicate(p: any): boolean {
    if (p.questionId) {
      return this.addedIds.has(p.questionId);
    }
    const n = this.normalize(p.texto);
    return this.addedTexts.has(n);
  }
  private registerInCaches(p: any) {
    if (p.questionId) {
      this.addedIds.add(p.questionId);
    } else {
      this.addedTexts.add(this.normalize(p.texto));
    }
  }
  private rebuildCaches() {
    this.addedIds.clear();
    this.addedTexts.clear();
    this.perguntasSelecionadas.forEach((p) => this.registerInCaches(p));
  }
  private showBanner(msg: string, tipo: "sucesso" | "erro") {
    this.bannerMsg = msg;
    this.bannerTipo = tipo;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.bannerMsg = null;
    }, 2500);
  }
  fecharBanner() {
    this.bannerMsg = null;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
  }

  private tryHideOverlay() {
    // Oculta overlay quando ambos (departamentos e perguntas) estiverem carregados
    if (this.depsLoaded && this.questionsLoaded) this.loadingOverlay = false;
  }

  toggleDepartment(id: number, checked: boolean) {
    if (checked) {
      if (!this.selectedDepartmentIds.includes(id)) {
        this.selectedDepartmentIds = [...this.selectedDepartmentIds, id];
      }
    } else {
      this.selectedDepartmentIds = this.selectedDepartmentIds.filter((x) => x !== id);
    }
  }
}
