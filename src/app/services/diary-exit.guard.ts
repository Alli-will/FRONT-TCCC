import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { DiarioComponent } from '../diario/diario.component';

@Injectable({ providedIn: 'root' })
export class DiaryExitGuard implements CanDeactivate<DiarioComponent> {
  // Guard agora sempre permite sair: requisito de obrigatoriedade removido.
  // Mantido para evitar erros de rota enquanto o front ainda referencia o guard.
  canDeactivate(_component: DiarioComponent): boolean {
    return true;
  }
}
