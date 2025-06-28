import { Routes } from "@angular/router";
import { DiarioComponent } from "../diario/diario.component";
import { LoginComponent } from "../login/login.component";
import { CadastroComponent } from "../Cadastro/cadastro.component";
import { HistoricoComponent } from "../diario/consulta/historico.component";
import { AuthGuard } from "./auth.guard";
import { EmBreveGuard } from "./em-breve.guard";
import { ConteudoEducacionalComponent } from "../conteudo-educacional/conteudo-educacional.component";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { DiaryEntryGuard } from '../services/diary-entry.guard';
import { DiaryExitGuard } from '../services/diary-exit.guard';
import { DiarioResolver } from '../diario/diario.resolver';
import { DashboardResolver } from '../dashboard/dashboard.resolver';

export const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "diario", component: DiarioComponent, canActivate: [AuthGuard], canDeactivate: [DiaryExitGuard], resolve: { preload: DiarioResolver } },
  {
    path: "conteudo-educacional",
    component: ConteudoEducacionalComponent,
    canActivate: [AuthGuard, DiaryEntryGuard],
  },
  { path: "login", component: LoginComponent },
  { path: "cadastro", component: CadastroComponent },
  {
    path: "historico",
    component: HistoricoComponent,
    canActivate: [AuthGuard, DiaryEntryGuard],
  },
  { path: "home", canActivate: [EmBreveGuard], component: LoginComponent },
  { path: "**", redirectTo: "dashboard" },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard, DiaryEntryGuard],
    resolve: { preload: DashboardResolver }
  },
];
