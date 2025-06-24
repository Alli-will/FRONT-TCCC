import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from './safe-url.pipe';

@Component({
  selector: 'app-detalhe-modal',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  template: `
    <div class="modal-backdrop" (click)="close()"></div>
    <div class="modal-content" role="dialog" aria-modal="true" tabindex="-1">
      <button class="close-btn" (click)="close()" aria-label="Fechar">
        &times;
      </button>
      <ng-container *ngIf="detalhe">
        <h2>{{ detalhe.titulo }}</h2>
        <div *ngIf="detalhe.tipo === 'texto'">
          <p class="detalhe-conteudo-completo">{{ detalhe.conteudo }}</p>
        </div>
        <div *ngIf="detalhe.tipo === 'audio'">
          <audio controls [src]="detalhe.conteudo" style="width:100%"></audio>
          <div *ngIf="detalhe.descricao" class="detalhe-descricao">
            {{ detalhe.descricao }}
          </div>
        </div>
        <div *ngIf="detalhe.tipo === 'video'">
          <ng-container
            *ngIf="detalhe.conteudo && detalhe.conteudo.includes('youtube.com')"
          >
            <iframe
              [src]="detalhe.conteudo | safeUrl"
              width="100%"
              height="260"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </ng-container>
          <ng-container
            *ngIf="
              detalhe.conteudo && !detalhe.conteudo.includes('youtube.com')
            "
          >
            <video
              controls
              [src]="detalhe.conteudo"
              style="max-width:100%;width:100%"
            ></video>
          </ng-container>
          <div *ngIf="detalhe.descricao" class="detalhe-descricao">
            {{ detalhe.descricao }}
          </div>
        </div>
        <div *ngIf="!detalhe.conteudo">
          <p class="detalhe-vazio">
            Nenhum conteúdo disponível para este exemplo.
          </p>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./detalhe-modal.component.css'],
})
export class DetalheModalComponent {
  @Input() detalhe: any;
  @Output() fechar = new EventEmitter<void>();

  close() {
    this.fechar.emit();
  }
}
