import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-cadastro-pesquisa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-pesquisa.component.html',
  styleUrls: ['./cadastro-pesquisa.component.css']
})
export class CadastroPesquisaComponent {
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
  escalaPadraoPulso: number[] = [0,1,2,3,4,5,6,7,8,9,10];
  escalaPadraoClima: number[] = [1,2,3,4,5];

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    this.carregarPadrao();
  }

  onChangeTipo() {
    this.carregarPadrao();
  }

  private carregarPadrao() {
    this.carregandoPerguntas = true;
    this.searchService.getDefaultQuestions(this.tipo as any).subscribe({
      next: (res) => {
        this.perguntasPadrao = res?.perguntas || [];
        this.perguntasSelecionadas = [...this.perguntasPadrao];
        this.carregandoPerguntas = false;
      },
      error: () => { this.carregandoPerguntas = false; }
    });
  }

  cadastrar() {
    if (this.carregando) return;
    this.sucesso = false;
    this.erro = '';
    this.carregando = true;
    const perguntas = this.perguntasSelecionadas.map(p => ({ texto: p.texto, opcoes: p.opcoes, obrigatoria: p.obrigatoria }));
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
    this.perguntasSelecionadas.splice(idx,1);
  }

  restaurarPadrao() {
    this.perguntasSelecionadas = [...this.perguntasPadrao];
  }

  addPerguntaCustom() {
    const texto = this.novaPerguntaTexto.trim();
    if (!texto || texto.length < 3) return;
  const opcoes = this.tipo === 'clima' ? this.escalaPadraoClima : this.escalaPadraoPulso;
  this.perguntasSelecionadas.push({ texto, opcoes, obrigatoria: true });
    this.novaPerguntaTexto = '';
  }
}
