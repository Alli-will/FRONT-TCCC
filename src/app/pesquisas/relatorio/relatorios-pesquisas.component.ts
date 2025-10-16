import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { SearchService } from "../../services/search.service";
import { MenuComponent } from "../../menu/menu.component";

@Component({
  selector: "app-relatorios-pesquisas",
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent],
  templateUrl: "./relatorios-pesquisas.component.html",
  styleUrls: ["./relatorios-pesquisas.component.css"],
})
export class RelatoriosPesquisasComponent {
  pesquisas: any[] = [];
  erro = "";
  page = 1;
  totalPages = 1;
  pageSize = 20;
  loading = true;
  constructor(private searchService: SearchService) {}
  ngOnInit() {
    this.carregar();
  }
  carregar() {
    this.loading = true;
    this.searchService.getAllSearches(this.page, this.pageSize, true).subscribe({
      next: (res: any) => {
        if (res?.items) {
          this.pesquisas = res.items;
          this.totalPages = res.meta?.totalPages || 1;
        } else this.pesquisas = res;
        this.loading = false;
      },
      error: () => {
        this.erro = "Erro ao carregar pesquisas.";
        this.loading = false;
      },
    });
  }
  mudarPagina(delta: number) {
    const nova = this.page + delta;
    if (nova < 1 || nova > this.totalPages) return;
    this.page = nova;
    this.carregar();
  }
  formatDate(d: any) {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  }
}
