import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-alerta-modal',
  templateUrl: './alerta-modal.component.html',
  styleUrls: ['./alerta-modal.component.css'],
})
export class AlertaModalComponent {
  @Input() titulo: string = 'Alerta';
  @Input() mensagem: string = '';
  @Input() exibir: boolean = false;
  @Input() textoBotao: string = 'OK';
  @Output() fechar = new EventEmitter<void>();

  onFechar() {
    this.fechar.emit();
  }
}
