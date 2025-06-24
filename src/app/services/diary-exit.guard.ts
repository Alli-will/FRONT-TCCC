import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { DiarioComponent } from '../diario/diario.component';

@Injectable({ providedIn: 'root' })
export class DiaryExitGuard implements CanDeactivate<DiarioComponent> {
  canDeactivate(component: DiarioComponent): boolean {
    // Só permite sair se o diário foi respondido hoje
    if (!(component as any).diarioRespondidoHoje) {
      if (typeof window !== 'undefined') {
        alert('Você precisa responder o diário de hoje antes de sair!');
      }
      return false;
    }
    return true;
  }
}
