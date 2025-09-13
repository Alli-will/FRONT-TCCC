import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { HttpClientModule } from '@angular/common/http';
import { QuestionService } from '../services/question.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perguntas',
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent, HttpClientModule, FormsModule],
  templateUrl: './perguntas.component.html',
  styleUrls: ['./perguntas.component.css']
})
export class PerguntasComponent implements OnInit {
  items: any[] = [];
  loading = true;
  editId: number|null = null;
  saving = false;
  openMenuId: number|null = null;
  // Banner de feedback (igual padrão do login)
  mensagem: string | null = null;
  bannerTipo: 'sucesso' | 'erro' = 'sucesso';
  private bannerTimer: any = null;
  // Modal de confirmação de exclusão
  confirmOpen = false;
  confirmTarget: any = null; // pergunta selecionada para excluir
  deleting = false;
  // Busca e paginação
  searchTerm = '';
  statusFilter: 'todas' | 'ativas' | 'inativas' = 'todas';
  pageSize = 10;
  page = 1;
  total = 0;
  totalPages = 1;
  displayed: any[] = [];
  constructor(private questions: QuestionService) {}
  ngOnInit(): void {
    this.questions.list().subscribe({
      next: (res: any) => {
        this.items = Array.isArray(res) ? res : (res?.items || []);
        this.loading = false;
        this.compute();
      },
      error: () => { this.items = []; this.loading = false; }
    });
  }
  private compute() {
    const term = this.searchTerm.trim().toLowerCase();
    let filtered = term
      ? this.items.filter((q: any) =>
          (q?.texto || '').toLowerCase().includes(term) ||
          (q?.descricaoBusca || '').toLowerCase().includes(term)
        )
      : this.items.slice();
    if (this.statusFilter === 'ativas') {
      filtered = filtered.filter((q: any) => q?.ativo !== false);
    } else if (this.statusFilter === 'inativas') {
      filtered = filtered.filter((q: any) => q?.ativo === false);
    }
    this.total = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;
    if (this.total > this.pageSize) {
      const start = (this.page - 1) * this.pageSize;
      this.displayed = filtered.slice(start, start + this.pageSize);
    } else {
      this.displayed = filtered;
    }
  }
  onSearchChange() {
    this.page = 1;
    this.compute();
  }
  onStatusChange() {
    this.page = 1;
    this.compute();
  }
  changePage(delta: number) {
    const next = this.page + delta;
    if (next < 1 || next > this.totalPages) return;
    this.page = next;
    this.compute();
  }
  goToPage(n: number) {
    if (n < 1 || n > this.totalPages || n === this.page) return;
    this.page = n;
    this.compute();
  }
  toggleMenu(id: number) { this.openMenuId = this.openMenuId === id ? null : id; }
  cancelEdit() { this.editId = null; this.saving = false; }
  toggleAtivo(q: any) {
    this.openMenuId = null;
    this.questions.update(q.id, { ativo: q.ativo===false }).subscribe({
  next: () => { q.ativo = !q.ativo; this.showBanner('Status atualizado.', 'sucesso'); },
  error: () => { this.showBanner('Falha ao alterar status.', 'erro'); }
    });
  }
  openConfirm(q: any) { this.openMenuId = null; this.confirmTarget = q; this.confirmOpen = true; }
  closeConfirm() { this.confirmOpen = false; this.confirmTarget = null; }
  confirmarExclusao() {
    if (!this.confirmTarget || this.deleting) return;
    this.deleting = true;
    const id = this.confirmTarget.id;
    this.questions.remove(id).subscribe({
      next: () => {
        this.items = this.items.filter(x => x.id !== id);
        this.compute();
        this.showBanner('Pergunta excluída com sucesso.', 'sucesso');
        this.closeConfirm();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Não foi possível excluir agora. Tente novamente.';
        this.showBanner(msg, 'erro');
        this.closeConfirm();
      },
      complete: () => { this.deleting = false; }
    });
  }

  dismissBanner() { this.mensagem = null; }
  private showBanner(msg: string, tipo: 'sucesso'|'erro') {
    this.mensagem = msg;
    this.bannerTipo = tipo;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.mensagem = null;
      this.bannerTimer = null;
    }, 2500);
  }
}
