import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  template: `
    <div class="loading-indicator">
      <img src="assets/favicon.png" alt="Logo" class="loading-logo" />
      <div class="loading-spinner"></div>
      <span>Carregando...</span>
    </div>
  `,
  styles: [`
    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      background: #fff;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 99999;
      gap: 18px;
    }
    .loading-logo {
      width: 64px;
      height: 64px;
      margin-bottom: 0;
      border-radius: 0;
      object-fit: contain;
      background: transparent;
      box-shadow: none;
      display: block;
    }
    .loading-spinner {
      border: 6px solid #eee;
      border-top: 6px solid #2196f3;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      animation: spin 1s linear infinite;
      margin-bottom: 0;
      margin-top: 0;
      display: block;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
    span {
      color: #2196f3;
      font-weight: 600;
      font-size: 1.1rem;
      margin-top: 0;
    }
  `]
})
export class LoadingIndicatorComponent {}
