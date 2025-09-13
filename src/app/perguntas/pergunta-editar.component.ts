import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { QuestionService } from '../services/question.service';

@Component({
  selector: 'app-pergunta-editar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MenuComponent],
  templateUrl: './pergunta-editar.component.html',
  styleUrls: ['./pergunta-editar.component.css']
})
export class PerguntaEditarComponent implements OnInit {
  id!: number;
  loading = true;
  saving = false;
  texto = '';
  descricaoBusca = '';
  modalidade: 'pulso'|'clima' = 'pulso';
  tipoResposta: 'qualitativa'|'quantitativa' = 'quantitativa';

  constructor(private route: ActivatedRoute, private router: Router, private questions: QuestionService) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : 0;
    this.questions.get(this.id).subscribe({
      next: (q: any) => {
        this.texto = q?.texto || '';
        this.descricaoBusca = q?.descricaoBusca || '';
        this.modalidade = (q?.modalidade === 'clima') ? 'clima' : 'pulso';
        this.tipoResposta = (q?.tipoResposta === 'qualitativa') ? 'qualitativa' : 'quantitativa';
        this.loading = false;
      },
      error: () => { alert('Pergunta não encontrada'); this.router.navigate(['/perguntas']); }
    });
  }

  salvar() {
    if (!this.texto.trim()) { alert('Informe o texto da pergunta.'); return; }
    this.saving = true;
    this.questions.update(this.id, { texto: this.texto.trim(), descricaoBusca: this.descricaoBusca?.trim(), modalidade: this.modalidade, tipoResposta: this.tipoResposta })
      .subscribe({
        next: () => { this.saving = false; this.router.navigate(['/perguntas']); },
        error: () => { this.saving = false; alert('Falha ao salvar.'); }
      });
  }
}
