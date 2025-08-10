import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../services/search.service';
import { CadastroPesquisaComponent } from '../cadastro-pesquisa/cadastro-pesquisa.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-pesquisas',
  standalone: true,
  imports: [CommonModule, CadastroPesquisaComponent, RouterModule, MenuComponent],
  templateUrl: './pesquisas.component.html',
  styleUrls: ['./pesquisas.component.css']
})
export class PesquisasComponent {
  pesquisas: any[] = [];
  erro = '';
  modo: 'listar' | 'cadastrar' = 'listar';
  page = 1;
  totalPages = 1;
  userId: number | null = null; // obtido do token, não usado mais diretamente
  isAdmin = false;

  constructor(private searchService: SearchService, private auth: AuthService) {}

  ngOnInit() {
    const info = this.auth.getUserInfoFromToken();
    if (info && info.sub) { this.userId = info.sub; }
  this.isAdmin = info?.role === 'admin';
    this.carregar();
  }

  carregar() {
  this.searchService.getAllSearches(this.page, 20).subscribe({
      next: (res: any) => {
        if (res && res.items) {
          this.pesquisas = res.items;
          this.totalPages = res.meta?.totalPages || 1;
        } else {
          this.pesquisas = res; // fallback se backend antigo
        }
      },
      error: () => this.erro = 'Erro ao carregar pesquisas.'
    });
  }

  mudarPagina(delta: number) {
    const nova = this.page + delta;
    if (nova < 1 || nova > this.totalPages) return;
    this.page = nova;
    this.carregar();
  }
}
