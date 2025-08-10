import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search.service';
import { MenuComponent } from '../menu/menu.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-responder-pesquisa',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent],
  templateUrl: './responder-pesquisa.component.html',
  styleUrls: ['./responder-pesquisa.component.css']
})
export class ResponderPesquisaComponent {
  carregando = true;
  erro = '';
  sucesso = false;
  pesquisa: any = null;
  respostas: Record<number, any> = {}; // index pergunta -> valor
  jaRespondida = false;
  tentativaEnvio = false;
  likertMap: Record<number, string> = {
    1: '1 – Discordo totalmente',
    2: '2 – Discordo parcialmente',
    3: '3 – Nem concordo, nem discordo',
    4: '4 – Concordo parcialmente',
    5: '5 – Concordo totalmente'
  };

  constructor(private route: ActivatedRoute, private searchService: SearchService, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
  if (!id) { this.erro = 'ID inválido'; this.carregando = false; return; }
  this.searchService.getSearchById(id).subscribe({
      next: (data) => { this.pesquisa = data; this.carregando = false; },
      error: (err) => { 
        if (err.status === 409) {
          this.jaRespondida = true;
          this.erro = 'Você já respondeu esta pesquisa.';
          this.carregando = false;
          // redireciona após 2s automaticamente
          setTimeout(() => this.router.navigate(['/pesquisas']), 2000);
        } else {
          this.erro = 'Erro ao carregar pesquisa';
          this.carregando = false; 
        }
      }
    });
  }

  selecionar(perguntaIndex: number, valor: any) {
    this.respostas[perguntaIndex] = valor;
  }

  labelOpcao(v: any): string {
    if (this.pesquisa?.tipo === 'clima' && this.likertMap[v]) return this.likertMap[v];
    return String(v);
  }

  enviar() {
    if (!this.pesquisa) return;
    this.tentativaEnvio = true;
    const perguntas = this.pesquisa.perguntas || [];
    const pendentes: number[] = [];
    perguntas.forEach((_: any, idx: number) => {
      const v = this.respostas[idx];
      if (v === undefined || v === null || v === '') pendentes.push(idx);
    });
    if (pendentes.length) {
      this.erro = `Responda todas as perguntas antes de enviar. Faltando: ${pendentes.map(i=> i+1).join(', ')}`;
      return;
    }
    const answers = perguntas.map((p: any, idx: number) => ({ pergunta: p.texto, resposta: this.respostas[idx] }));
    this.searchService.respondSearch({ searchId: this.pesquisa.id, answers }).subscribe({
      next: () => { 
        this.sucesso = true; 
        this.erro = '';
        setTimeout(() => this.router.navigate(['/pesquisas']), 2000);
      },
      error: (err) => {
        if (err.status === 409) {
          this.erro = 'Você já respondeu esta pesquisa.';
        } else if (err.status === 400) {
          // mensagem detalhada do backend
          const msg = err.error?.message;
          this.erro = Array.isArray(msg) ? msg.join(' ') : (msg || 'Falha ao enviar respostas');
        } else {
          this.erro = 'Falha ao enviar respostas';
        }
      }
    });
  }

  isIncompleta(index: number): boolean {
    if (!this.tentativaEnvio) return false;
    const v = this.respostas[index];
    return v === undefined || v === null || v === '';
  }
}
