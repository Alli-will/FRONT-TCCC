import { Routes } from "@angular/router";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { BlockSupportDashboardGuard } from "./block-support-dashboard.guard";
import { BlockSupportDiaryGuard } from "./block-support-diary.guard";
import { LoginComponent } from "../login/login.component";
import { CadastroComponent } from "../Cadastro/cadastro.component";
import { AuthGuard } from "./auth.guard";
import { EmBreveGuard } from "./em-breve.guard";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { UsuariosComponent } from "../usuarios/usuarios.component";
import { DashboardResolver } from "../dashboard/dashboard.resolver";
import { AdminGuard } from "./admin.guard";
import { CanActivateFn } from "@angular/router";

import { Component } from "@angular/core";

@Component({ template: "" })
class RootRedirectComponent {
  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);
    const info = auth.getUserInfoFromToken();
    if (info?.role === "support") router.navigate(["/empresa"]);
    else router.navigate(["/pesquisas"]);
  }
}

export const usuariosGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const info = auth.getUserInfoFromToken();
  if (info?.role === "admin") return true;
  router.navigate(["/pesquisas"]);
  return false;
};

export const empresaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const info = auth.getUserInfoFromToken();
  const role = (info?.role || '').toString().toLowerCase();
  if (role === 'admin' || role === 'support') return true;
  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { reason: 'auth' } });
    return false;
  }
  router.navigate(['/pesquisas'], { queryParams: { denied: 'empresa' } });
  return false;
};

export const routes: Routes = [
  {
    path: "",
    component: RootRedirectComponent,
    canActivate: [AuthGuard],
    children: [],
    pathMatch: "full",
  },
  {
    path: "empresa",
    canActivate: [AuthGuard, empresaGuard],
    loadComponent: () => import("../empresa/empresa.component").then((m) => m.EmpresaComponent),
  },
  {
    path: "empresa/usuarios/:id",
    canActivate: [AuthGuard, empresaGuard],
    loadComponent: () =>
      import("../empresa/empresa-usuarios.component").then((m) => m.EmpresaUsuariosComponent),
  },
  {
    path: "departamentos",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("../departamentos/departamentos.component").then((m) => m.DepartamentosComponent),
  },
  {
    path: "departamentos/novo",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("../departamentos/departamento-novo.component").then(
        (m) => m.DepartamentoNovoComponent
      ),
  },
  { path: "login", component: LoginComponent },
  {
    path: "recuperar-senha",
    loadComponent: () =>
      import("../login/recuperar-senha.component").then((m) => m.RecuperarSenhaComponent),
  },
  {
    path: "nova-senha/:token",
    loadComponent: () =>
      import("../login/definir-nova-senha.component").then((m) => m.DefinirNovaSenhaComponent),
  },
  { path: "cadastro", component: CadastroComponent },
  { path: "usuarios", component: UsuariosComponent, canActivate: [AuthGuard, usuariosGuard] },
  {
    path: "perfil",
    canActivate: [AuthGuard],
    loadComponent: () => import("../perfil/perfil.component").then((m) => m.PerfilComponent),
  },
  {
    path: "usuarios/cadastrar",
    canActivate: [AuthGuard, usuariosGuard],
    loadComponent: () =>
      import("../usuarios/cadastrar-colaborador.component").then(
        (m) => m.CadastrarColaboradorComponent
      ),
  },
  { path: "home", canActivate: [EmBreveGuard], component: LoginComponent },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard, BlockSupportDashboardGuard],
    resolve: { preload: DashboardResolver },
  },

  // Dashboard de Clima Organizacional
  {
    path: "dashboard-clima",
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () =>
      import("../dashboard-clima/dashboard-clima.component").then((m) => m.DashboardClimaComponent),
  },

  {
    path: "pesquisa",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("../cadastro-pesquisa/cadastro-pesquisa.component").then(
        (m) => m.CadastroPesquisaComponent
      ),
  },
  {
    path: "pesquisas",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("../pesquisas/pesquisas.component").then((m) => m.PesquisasComponent),
  },
  {
    path: "relatorios-pesquisas",
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () =>
      import("../pesquisas/relatorio/relatorios-pesquisas.component").then(
        (m) => m.RelatoriosPesquisasComponent
      ),
  },
  {
    path: "perguntas",
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () =>
      import("../perguntas/perguntas.component").then((m) => m.PerguntasComponent),
  },
  {
    path: "perguntas/nova",
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () =>
      import("../perguntas/pergunta-nova.component").then((m) => m.PerguntaNovaComponent),
  },
  {
    path: "perguntas/:id/editar",
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () =>
      import("../perguntas/pergunta-editar.component").then((m) => m.PerguntaEditarComponent),
  },
  {
    path: "responder-pesquisa/:id",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("../responder-pesquisa/responder-pesquisa.component").then(
        (m) => m.ResponderPesquisaComponent
      ),
  },
  {
    path: "relatorio-pesquisa/:id",
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () =>
      import("../pesquisas/relatorio/relatorio-pesquisa.component").then(
        (m) => m.RelatorioPesquisaComponent
      ),
  },
  { path: "**", redirectTo: "pesquisas" },
];
