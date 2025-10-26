import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SearchService } from "../services/search.service";
import { CadastroPesquisaComponent } from "../cadastro-pesquisa/cadastro-pesquisa.component";
import { RouterModule } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { DepartmentService } from "../services/department.service";
import { MenuComponent } from "../menu/menu.component";

@Component({
  selector: "app-pesquisas",
  standalone: true,
  imports: [CommonModule, CadastroPesquisaComponent, RouterModule, MenuComponent],
  templateUrl: "./pesquisas.component.html",
  styleUrls: ["./pesquisas.component.css"],
})
export class PesquisasComponent {
  pesquisas: any[] = [];
  erro = "";
  modo: "listar" | "cadastrar" = "listar";
  page = 1;
  totalPages = 1;
  userId: number | null = null; // obtido do token
  isAdmin = false;
  editando: any | null = null;
  // Banner de feedback
  bannerMsg: string | null = null;
  bannerTipo: "sucesso" | "erro" = "sucesso";
  private bannerTimer: any = null;
  // Modal informativo 
  showInfoModal = false;
  infoTitle = "";
  infoMessage = "";
  // Modal de confirmação de exclusão
  showConfirmModal = false;
  confirmTitle = "Confirmar exclusão";
  confirmMessage = "Confirma excluir esta pesquisa? Essa ação não pode ser desfeita.";
  confirmTargetId: number | null = null;
  deletando = false;

  constructor(
    private searchService: SearchService,
    private auth: AuthService,
    private dept: DepartmentService
  ) {}

  ngOnInit() {
    const info = this.auth.getUserInfoFromToken();
    if (info && info.sub) {
      this.userId = info.sub;
    }
    this.isAdmin = info?.role === "admin";
    this.dept.getAll().subscribe({ next: () => {}, error: () => {} });
    this.carregar();
  }

  carregar() {
    this.searchService.getAllSearches(this.page, 20).subscribe({
      next: (res: any) => {
        if (res && res.items) {
          this.pesquisas = res.items;
          this.totalPages = res.meta?.totalPages || 1;
        } else {
          this.pesquisas = res;
        }
      },
      error: () => (this.erro = "Erro ao carregar pesquisas."),
    });
  }

  mudarPagina(delta: number) {
    const nova = this.page + delta;
    if (nova < 1 || nova > this.totalPages) return;
    this.page = nova;
    this.carregar();
  }

  iniciarEdicao(p: any) {
    if ((p?.respondentes ?? 0) > 0) {
      this.openInfoModal(
        "Edição bloqueada",
        "Esta pesquisa já possui respostas e não pode ser editada."
      );
      return;
    }
    this.editando = p;
    this.modo = "cadastrar";
  }

  cancelarEdicao() {
    this.editando = null;
    this.modo = "listar";
  }

  excluir(p: any) {
    if (!p?.id) return;
    if ((p?.respondentes ?? 0) > 0) {
      this.openInfoModal(
        "Exclusão bloqueada",
        "Esta pesquisa já possui respostas e não pode ser excluída."
      );
      return;
    }
    this.confirmTargetId = p.id;
    this.confirmTitle = "Confirmar exclusão";
    this.confirmMessage = "Confirma excluir esta pesquisa? Essa ação não pode ser desfeita.";
    this.showConfirmModal = true;
    try {
      if (typeof document !== 'undefined') document.body.classList.add('body-lock');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('body-modal-open'));
    } catch {}
  }

  confirmExcluir() {
    if (this.deletando) return;
    if (!this.confirmTargetId) { this.showConfirmModal = false; return; }
    const id = this.confirmTargetId;
    this.deletando = true;
    this.searchService.deleteSearch(id).subscribe({
      next: () => {
        this.showConfirmModal = false;
        this.confirmTargetId = null;
        this.deletando = false;
        try {
          if (typeof document !== 'undefined') document.body.classList.remove('body-lock');
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('body-modal-close'));
        } catch {}
        this.carregar();
        this.showBanner("Pesquisa excluída com sucesso.", "sucesso");
      },
      error: (e) => {
        this.showConfirmModal = false;
        this.confirmTargetId = null;
        this.deletando = false;
        try {
          if (typeof document !== 'undefined') document.body.classList.remove('body-lock');
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('body-modal-close'));
        } catch {}
        this.openInfoModal(
          "Ação não concluída",
          e?.error?.message || "Não foi possível excluir. Verifique se já há respostas."
        );
      },
    });
  }

  cancelarExcluir() {
    if (this.deletando) return;
    this.showConfirmModal = false;
    this.confirmTargetId = null;
    try {
      if (typeof document !== 'undefined') document.body.classList.remove('body-lock');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('body-modal-close'));
    } catch {}
  }

  onCriado(evt?: { tipo?: "cadastrada" | "alterada" }) {
    this.carregar();
    this.modo = "listar";
    this.editando = null;
    const tipo = evt?.tipo || "cadastrada";
    const msg = tipo === "alterada" ? "Pesquisa alterada com sucesso." : "Pesquisa cadastrada com sucesso.";
    this.showBanner(msg, "sucesso");
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

  openInfoModal(title: string, message: string) {
    this.infoTitle = title;
    this.infoMessage = message;
    this.showInfoModal = true;
  }

  closeInfoModal() {
    this.showInfoModal = false;
  }
}
