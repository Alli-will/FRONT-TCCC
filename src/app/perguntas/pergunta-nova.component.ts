import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { QuestionService } from '../services/question.service';

@Component({
  selector: 'app-pergunta-nova',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MenuComponent],
  templateUrl: './pergunta-nova.component.html',
  styleUrls: ['./pergunta-nova.component.css']
})
export class PerguntaNovaComponent {
  texto = '';
  descricaoBusca = '';
  modalidade: 'pulso' | 'clima' = 'pulso';
  tipoResposta: 'qualitativa' | 'quantitativa' = 'quantitativa';
  // Banner de feedback (igual padrão do login)
  mensagem: string | null = null;
  bannerTipo: 'sucesso' | 'erro' = 'sucesso';
  private bannerTimer: any = null;

  constructor(private questions: QuestionService) {}

  salvar() {
    if (!this.texto.trim()) { this.showBanner('Informe o texto da pergunta.', 'erro'); return; }
    this.questions.create({ texto: this.texto.trim(), descricaoBusca: this.descricaoBusca?.trim(), modalidade: this.modalidade, tipoResposta: this.tipoResposta })
      .subscribe({
        next: () => { this.showBanner('Pergunta cadastrada com sucesso.', 'sucesso'); setTimeout(()=> history.back(), 600); },
        error: (e) => { this.showBanner('Falha ao cadastrar pergunta.', 'erro'); console.error(e); }
      });
  }

  dismissBanner() { this.mensagem = null; }
  private showBanner(msg: string, tipo: 'sucesso'|'erro') {
    this.mensagem = msg;
    this.bannerTipo = tipo;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { this.mensagem = null; this.bannerTimer = null; }, 2500);
  }
}
