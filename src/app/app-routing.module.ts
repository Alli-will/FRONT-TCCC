import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'pesquisa',
    loadComponent: () =>
      import('./cadastro-pesquisa/cadastro-pesquisa.component').then(
        (m) => m.CadastroPesquisaComponent
      ),
  },
  {
    path: 'pesquisas',
    loadComponent: () =>
      import('./pesquisas/pesquisas.component').then((m) => m.PesquisasComponent),
  },
  { path: '', redirectTo: '/pesquisas', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
