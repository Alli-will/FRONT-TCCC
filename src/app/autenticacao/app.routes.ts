import { Routes } from "@angular/router";
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DiarioComponent } from "../diario/diario.component";
import { BlockSupportDashboardGuard } from './block-support-dashboard.guard';
import { BlockSupportDiaryGuard } from './block-support-diary.guard';
import { LoginComponent } from "../login/login.component";
import { CadastroComponent } from "../Cadastro/cadastro.component";
import { HistoricoComponent } from "../diario/consulta/historico.component";
import { AuthGuard } from "./auth.guard";
import { EmBreveGuard } from "./em-breve.guard";
import { ConteudoEducacionalComponent } from "../conteudo-educacional/conteudo-educacional.component";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { UsuariosComponent } from '../usuarios/usuarios.component';
import { DiaryEntryGuard } from '../services/diary-entry.guard';
import { DiaryExitGuard } from '../services/diary-exit.guard';
import { DiarioResolver } from '../diario/diario.resolver';
import { DashboardResolver } from '../dashboard/dashboard.resolver';
import { AdminGuard } from './admin.guard';


import { Component } from '@angular/core';

@Component({ template: '' })
class RootRedirectComponent {
  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);
    const info = auth.getUserInfoFromToken();
  // Redireciona:
  // support -> /empresa
  // demais (employee, admin, etc) -> /pesquisas (nova página inicial)
  if (info?.role === 'support') router.navigate(['/empresa']);
  else router.navigate(['/pesquisas']);
  }
}

export const routes: Routes = [
  { path: '', component: RootRedirectComponent, canActivate: [AuthGuard], children: [], pathMatch: 'full' },
  { path: "diario", component: DiarioComponent, canActivate: [AuthGuard, BlockSupportDiaryGuard], canDeactivate: [DiaryExitGuard], resolve: { preload: DiarioResolver } },
  {
    path: "conteudo-educacional",
    component: ConteudoEducacionalComponent,
    canActivate: [AuthGuard, DiaryEntryGuard],
  },
  { path: 'empresa', canActivate: [AuthGuard], loadComponent: () => import('../empresa/empresa.component').then(m => m.EmpresaComponent) },
  { path: 'empresa/usuarios/:id', canActivate: [AuthGuard], loadComponent: () => import('../empresa/empresa-usuarios.component').then(m => m.EmpresaUsuariosComponent) },
  { path: 'departamentos', canActivate: [AuthGuard], loadComponent: () => import('../departamentos/departamentos.component').then(m => m.DepartamentosComponent) },
  { path: 'departamentos/novo', canActivate: [AuthGuard], loadComponent: () => import('../departamentos/departamento-novo.component').then(m => m.DepartamentoNovoComponent) },
  { path: "login", component: LoginComponent },
  { path: "cadastro", component: CadastroComponent },
  {
    path: "historico",
    component: HistoricoComponent,
    canActivate: [AuthGuard, DiaryEntryGuard],
  },
  { path: "usuarios", component: UsuariosComponent, canActivate: [AuthGuard] },
  { path: "perfil", canActivate: [AuthGuard], loadComponent: () => import('../perfil/perfil.component').then(m => m.PerfilComponent) },
  { path: 'usuarios/cadastrar', canActivate: [AuthGuard], loadComponent: () => import('../usuarios/cadastrar-colaborador.component').then(m => m.CadastrarColaboradorComponent) },
  { path: "home", canActivate: [EmBreveGuard], component: LoginComponent },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard, DiaryEntryGuard, BlockSupportDashboardGuard],
    resolve: { preload: DashboardResolver }
  },
  // --- ROTAS DE PESQUISA (standalone components) ---
  {
    path: 'pesquisa',
    canActivate: [AuthGuard],
    loadComponent: () => import('../cadastro-pesquisa/cadastro-pesquisa.component').then(m => m.CadastroPesquisaComponent)
  },
  {
    path: 'pesquisas',
    canActivate: [AuthGuard],
    loadComponent: () => import('../pesquisas/pesquisas.component').then(m => m.PesquisasComponent)
  },
  {
    path: 'relatorios-pesquisas',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('../pesquisas/relatorios-pesquisas.component').then(m => m.RelatoriosPesquisasComponent)
  },
  {
    path: 'responder-pesquisa/:id',
    canActivate: [AuthGuard],
    loadComponent: () => import('../responder-pesquisa/responder-pesquisa.component').then(m => m.ResponderPesquisaComponent)
  },
  {
    path: 'relatorio-pesquisa/:id',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('../pesquisas/relatorio-pesquisa.component').then(m => m.RelatorioPesquisaComponent)
  },
  { path: "**", redirectTo: "pesquisas" },
];
