import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SearchService } from "../services/search.service";
import { DepartmentService } from "../services/department.service";
import { MenuComponent } from "../menu/menu.component";

@Component({
  selector: "app-relatorio-pesquisa",
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-menu></app-menu>
    <div class="relatorio-page" *ngIf="loaded; else loadingTpl">
      <div class="header">
        <h2>Relatório da Pesquisa</h2>
        <a routerLink="/relatorios-pesquisas" class="voltar btn-primario">Voltar</a>
      </div>
      <div *ngIf="erro" class="erro">{{ erro }}</div>
      <ng-container *ngIf="!erro">
        <div class="meta">
          <div class="meta-left">
            <h3>{{ report?.titulo }}</h3>
            <div class="data" *ngIf="report?.createdAt">
              Data: {{ formatDate(report.createdAt) }}
            </div>
            <div
              class="pill"
              [class.pulso]="report?.tipo === 'pulso'"
              [class.clima]="report?.tipo === 'clima'"
            >
              {{ report?.tipo }}
            </div>
            <div class="meta-row">
              <div class="resumo">
                Respondentes: <strong>{{ report?.totalRespondentes }}</strong>
              </div>
              <ng-container *ngIf="departments.length">
                <div class="setor-filter">
                  <label class="lbl">Setor</label>
                  <div class="select-wrapper">
                    <select [(ngModel)]="selectedDepartmentId" (change)="reload()">
                      <option [ngValue]="undefined">Todos os Setores</option>
                      <option *ngFor="let d of departments" [ngValue]="d.id">{{ d.name }}</option>
                    </select>
                    <span class="icon">▾</span>
                  </div>
                  <div *ngIf="selectedDepartmentId" class="chip" (click)="clearDept()">
                    {{ currentDepartmentName() }} <span class="x">×</span>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
          <!-- meta-right removido para evitar duplicidade do seletor de setor -->
        </div>
        <div *ngIf="canShowNps()" class="nps-block">
          <div class="nps-card">
            <div class="nps-value">
              eNPS (1ª pergunta):
              <span [style.color]="getNpsColor(report?.nps)">{{ report?.nps }}</span>
            </div>
            <div class="metodo-hint">
              Considera apenas a primeira resposta de cada usuário. Classificação: Promotores
              (9–10), Neutros (7–8), Detratores (0–6). O eNPS é calculado por: %Promotores –
              %Detratores. A distribuição mostra as notas da 1ª pergunta.
            </div>
            <div class="nps-bars">
              <!-- Ordem: Detratores, Neutros, Promotores (cores alinhadas com distribuição) -->
              <div
                class="bar detratores"
                [style.width]="pct(report?.detratores)"
                title="Detratores"
              >
                Detratores {{ pct(report?.detratores) }}
              </div>
              <div class="bar neutros" [style.width]="pct(report?.neutros)" title="Neutros">
                Neutros {{ pct(report?.neutros) }}
              </div>
              <div
                class="bar promotores"
                [style.width]="pct(report?.promotores)"
                title="Promotores"
              >
                Promotores {{ pct(report?.promotores) }}
              </div>
            </div>
            <div class="dist-nps enhanced">
              <div
                *ngFor="let k of npsKeys()"
                class="nps-col"
                [ngClass]="scoreClasse(k)"
                [title]="scoreTooltip(k)"
              >
                <div class="score-line">{{ k }}</div>
                <div class="meta-line">
                  <span class="cnt" [class.zero]="report?.npsDistribuicao[k]?.count === 0"
                    >{{ report?.npsDistribuicao[k]?.count }}x</span
                  >
                  <span class="sep">•</span>
                  <span class="perc" [class.zero]="report?.npsDistribuicao[k]?.percent === 0">{{
                    formatPercent(report?.npsDistribuicao[k]?.percent)
                  }}</span>
                </div>
                <div class="mini-bar-wrap">
                  <div class="mini-bar-bg"></div>
                  <div
                    class="mini-bar-fill"
                    [style.width]="(report?.npsDistribuicao[k]?.percent || 0) + '%'"
                    [style.background]="getScoreBandColor(+k, 'pulso')"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          *ngIf="selectedDepartmentId && !canShowNps() && report?.tipo === 'pulso'"
          class="nps-bloqueado"
        >
          NPS indisponível para este setor: não há dados suficientes para análise(mínimo 2
          respondentes necessários).
        </div>
        <h4 *ngIf="canShowPerguntas()">Perguntas</h4>
        <div *ngIf="!canShowPerguntas()" class="nps-bloqueado">
          Perguntas e médias não exibidas por ausência de dados suficientes para análise.
        </div>
        <ng-container *ngIf="canShowPerguntas() && report?.perguntas?.length">
          <table class="tbl-perguntas desktop-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>Pergunta</th>
                <th style="width:90px;">Média</th>
                <th>Distribuição</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of report.perguntas; let i = index">
                <td class="index-cell">{{ p.index + 1 }}</td>
                <td class="question-cell">{{ p.texto }}</td>
                <td>
                  <ng-container *ngIf="p.tipoResposta === 'quantitativa' && p.media !== null">
                    {{ p.media }}
                  </ng-container>
                </td>
                <td class="dist-cell">
                  <!-- Quantitativa: mostra a barra -->
                  <div
                    class="dist-bar"
                    *ngIf="p.tipoResposta === 'quantitativa' && p.distribuicao"
                    [ngStyle]="{ background: gradientBackground(p.distribuicao, report?.tipo) }"
                    title="Distribuição das notas"
                  >
                    <ng-container *ngFor="let seg of gradientSegments(p.distribuicao, report?.tipo)">
                      <div
                        class="dist-label"
                        *ngIf="seg.percent >= 5"
                        [ngStyle]="{
                          left: seg.start + '%',
                          width: seg.width + '%',
                          color: seg.textColor,
                        }"
                      >
                        {{ seg.percent.toFixed(0) }}%
                      </div>
                    </ng-container>
                  </div>
                  <!-- Qualitativa: centraliza o botão na célula -->
                  <div
                    class="dist-actions-center"
                    *ngIf="p.tipoResposta === 'qualitativa' && canShowPerguntas()"
                  >
                    <button class="btn-primario" (click)="openTextAnswersModal(i, p.texto)">
                      Ver respostas
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mobile-perguntas">
            <div class="mobile-pergunta-card" *ngFor="let p of report.perguntas; let i = index">
              <div class="mobile-pergunta-header">
                <span class="mobile-pergunta-num">{{ p.index + 1 }}</span>
                <span class="mobile-pergunta-media" *ngIf="p.tipoResposta === 'quantitativa' && p.media !== null"
                  >Média: <strong>{{ p.media }}</strong></span
                >
              </div>
              <div class="mobile-pergunta-texto">{{ p.texto }}</div>
              <div
                class="dist-bar mobile-bar"
                *ngIf="p.tipoResposta === 'quantitativa' && p.distribuicao"
                [ngStyle]="{ background: gradientBackground(p.distribuicao, report?.tipo) }"
                title="Distribuição das notas"
              >
                <ng-container *ngFor="let seg of gradientSegments(p.distribuicao, report?.tipo)">
                  <div
                    class="dist-label"
                    *ngIf="seg.percent >= 5"
                    [ngStyle]="{
                      left: seg.start + '%',
                      width: seg.width + '%',
                      color: seg.textColor,
                    }"
                  >
                    {{ seg.percent.toFixed(0) }}%
                  </div>
                </ng-container>
              </div>
              <div class="mobile-actions">
                <button
                  *ngIf="p.tipoResposta === 'qualitativa' && canShowPerguntas()"
                  class="btn-primario"
                  (click)="openTextAnswersModal(i, p.texto)"
                >
                  Ver respostas
                </button>
              </div>
            </div>
          </div>
        </ng-container>
        <div *ngIf="!report?.perguntas?.length">Sem perguntas.</div>
      </ng-container>
    </div>
    <!-- Modal Respostas Textuais -->
    <div class="modal-overlay" *ngIf="showTextModal" (click)="closeTextAnswersModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="md-header">
          <h5>Respostas</h5>
          <button class="btn-ghost" (click)="closeTextAnswersModal()">Fechar</button>
        </div>
        <div class="modal-question" *ngIf="textQuestionTitle">
          <strong>Pergunta:</strong> {{ textQuestionTitle }}
        </div>
        <div class="mini-list" *ngIf="!loadingTextAnswers && textAnswers.length; else textLoading">
          <div class="row" *ngFor="let r of textAnswers; let i = index">
            <div class="idx-badge" [attr.aria-label]="'Resposta ' + (i + 1)">{{ i + 1 }}</div>
            <div class="t">
              <div class="txt">{{ r.texto }}</div>
            </div>
          </div>
        </div>
        <ng-template #textLoading>
          <div class="mini-list">
            <div class="placeholder" *ngIf="loadingTextAnswers">Carregando respostas...</div>
            <div class="placeholder" *ngIf="!loadingTextAnswers && textMinThreshold && textTotal && textTotal < textMinThreshold">
              Por privacidade, respostas só aparecem quando houver pelo menos {{ textMinThreshold }} respostas.
            </div>
            <div class="placeholder" *ngIf="!loadingTextAnswers && (!textTotal || textTotal === 0)">
              Nenhuma resposta qualitativa disponível.
            </div>
          </div>
        </ng-template>
      </div>
    </div>

    <ng-template #loadingTpl>
      <app-menu></app-menu>
      <div class="relatorio-page">Carregando relatório...</div>
    </ng-template>
  `,
  styles: [
    `
      .relatorio-page {
        max-width: 1800px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        margin-top: 3.5rem;
      }

      @media (min-width: 1330px) {
        .relatorio-page {
          padding-left: 290px !important;
          padding-right: 2rem;
          padding-top: 2.5rem;
          padding-bottom: 2.5rem;
          box-sizing: border-box;
        }
      }
      @media (max-width: 700px) {
        .relatorio-page {
          padding: 1.1rem 0.3rem 1.5rem 0.3rem;
          margin-top: 4.2rem;
        }
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.2rem;
      }
      h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 700;
      }
      .voltar {
        text-decoration: none;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.2rem;
        background: linear-gradient(90deg, #f7fafb, #f0f6f8);
        padding: 1rem 1.1rem;
        border: 1px solid #e1ebef;
        border-radius: 0.9rem;
      }
      .meta-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.7rem;
      }
      .meta-left {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
      }
      .meta-right {
        display: flex;
        align-items: center;
      }
      .meta h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
      }
      .pill {
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.35rem 0.55rem;
        border-radius: 0.6rem;
        background: #e2eef2;
        color: #2d3a41;
      }
      .pill.pulso {
        background: #e1faf5;
        color: #1c7e72;
      }
      .pill.clima {
        background: #e7f0ff;
        color: #2b5fa8;
      }
      .resumo {
        font-size: 0.75rem;
        color: #2d3a41;
        background: #fff;
        padding: 0.4rem 0.6rem;
        border: 1px solid #dbe7ec;
        border-radius: 0.6rem;
      }
      .setor-filter {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .setor-filter .lbl {
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #4a5b63;
      }
      .select-wrapper {
        position: relative;
      }
      .select-wrapper select {
        appearance: none;
        -webkit-appearance: none;
        font-size: 0.7rem;
        padding: 0.45rem 1.7rem 0.45rem 0.65rem;
        border: 1px solid #cfdfe5;
        background: #fff;
        border-radius: 0.55rem;
        outline: none;
        font-weight: 500;
        color: #264d58;
        box-shadow: 0 1px 2px #0000000b inset;
        transition: 0.15s border;
      }
      .select-wrapper select:focus {
        border-color: #38b6a5;
      }
      .select-wrapper .icon {
        position: absolute;
        right: 0.55rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.65rem;
        pointer-events: none;
        color: #52727d;
      }
      .chip {
        background: #e1faf5;
        border: 1px solid #b4efe3;
        color: #136d62;
        font-size: 0.6rem;
        padding: 0.35rem 0.55rem;
        border-radius: 2rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        cursor: pointer;
        user-select: none;
      }
      .chip:hover {
        background: #d3f4ed;
      }
      .chip .x {
        font-weight: 600;
        line-height: 1;
      }
      .nps-card {
        background: #fff;
        border: 1px solid #e0edf3;
        padding: 1rem 1.2rem 1.2rem;
        border-radius: 0.9rem;
        box-shadow: 0 2px 6px #0000000d;
        margin-bottom: 1.4rem;
      }
      .nps-value {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.4rem;
      }
      .metodo-hint {
        font-size: 0.6rem;
        color: #546974;
        margin-bottom: 0.7rem;
        line-height: 1.1rem;
      }
      .nps-bars {
        display: flex;
        height: 28px;
        border-radius: 0.5rem;
        overflow: hidden;
        background: #f1f5f7;
        font-size: 0.65rem;
        font-weight: 600;
        color: #fff;
        text-shadow: 0 1px 2px #0005;
      }
      .nps-bars .bar {
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        transition: width 0.3s ease;
      }
      .bar.detratores {
        background: #e53935;
      }
      .bar.neutros {
        background: #fbc02d;
        color: #2d2d2d;
        text-shadow: none;
      }
      .bar.promotores {
        background: #43a047;
      }
      .dist-nps {
        display: grid;
        grid-template-columns: repeat(11, 1fr);
        gap: 0.45rem;
        margin-top: 1rem;
      }
      .dist-nps.enhanced .nps-col {
        position: relative;
        background: #fff;
        border: 1px solid #dfe9ee;
        padding: 0.35rem 0.3rem 0.5rem;
        border-radius: 0.55rem;
        text-align: center;
        box-shadow: 0 1px 2px #00000008;
        transition:
          0.15s box-shadow,
          0.15s transform;
      }
      .dist-nps.enhanced .nps-col:hover {
        box-shadow: 0 3px 8px -2px #00000018;
        transform: translateY(-2px);
      }
      .dist-nps.enhanced .score-line {
        font-size: 0.7rem;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 0.15rem;
      }
      .dist-nps.enhanced .meta-line {
        display: flex;
        justify-content: center;
        gap: 0.25rem;
        font-size: 0.52rem;
        font-weight: 600;
        color: #475a63;
        margin-bottom: 0.25rem;
      }
      .dist-nps.enhanced .meta-line .zero {
        color: #a8b5bb;
      }
      .dist-nps.enhanced .mini-bar-wrap {
        position: relative;
        height: 5px;
        border-radius: 3px;
        overflow: hidden;
        background: transparent;
      }
      .dist-nps.enhanced .mini-bar-bg {
        position: absolute;
        inset: 0;
        background: #eef4f6;
      }
      .dist-nps.enhanced .mini-bar-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: #43a047;
        border-radius: 3px;
      }
      /* Category accents */
      .dist-nps.enhanced .nps-col.detrator {
        border-color: #f6d3d2;
      }
      .dist-nps.enhanced .nps-col.detrator .score-line {
        color: #e53935;
      }
      .dist-nps.enhanced .nps-col.neutro {
        border-color: #f7e2a6;
      }
      .dist-nps.enhanced .nps-col.neutro .score-line {
        color: #f9a825;
      }
      .dist-nps.enhanced .nps-col.promotor {
        border-color: #c3e8c8;
      }
      .dist-nps.enhanced .nps-col.promotor .score-line {
        color: #2e7d32;
      }
      .dist-nps.enhanced .nps-col.detrator .mini-bar-fill {
        background: #e53935;
      }
      .dist-nps.enhanced .nps-col.neutro .mini-bar-fill {
        background: #fbc02d;
      }
      .dist-nps.enhanced .nps-col.promotor .mini-bar-fill {
        background: #43a047;
      }
      .tbl-perguntas {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        box-shadow: 0 2px 8px #0000000d;
        border: 1px solid #e0edf3;
        overflow-x: auto;
      }
      .tbl-perguntas th {
        text-align: left;
        font-size: 0.7rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding: 0.65rem 0.7rem;
        background: #f5f9fa;
      }
      .tbl-perguntas td {
        padding: 0.55rem 0.7rem;
        font-size: 0.8rem;
        vertical-align: top;
        border-top: 1px solid #eef3f5;
      }
      /* Centralizar verticalmente a pergunta */
      .tbl-perguntas td.index-cell,
      .tbl-perguntas td.question-cell {
        vertical-align: middle;
      }
      /* Centralização vertical na célula de distribuição */
      .tbl-perguntas td.dist-cell {
        vertical-align: middle;
        display: flex;
        align-items: center; /* centra verticalmente conteúdo (barra ou botão) */
        justify-content: flex-start; /* mantém barra alinhada à esquerda */
      }
      .dist-actions-center {
        display: flex;
        align-items: center;
        justify-content: center; /* centraliza o botão dentro do bloco */
        min-height: 24px;
  /* usar a mesma largura do bloco de distribuição */
  width: 360px;
        max-width: 100%;
  min-width: 160px;
      }
      /* (usando .btn-primario global) */
      .mobile-bar,
      .mobile-perguntas {
        display: none;
      }
      /* Botão um pouco mais estreito dentro do bloco de distribuição */
      .dist-actions-center .btn-primario {
        padding: 0.55rem 1rem;
        border-radius: 0.7rem;
      }
      .mobile-perguntas {
        margin-top: 1.2rem;
      }
      .mobile-pergunta-card {
        background: #fff;
        border: 1px solid #e0edf3;
        border-radius: 0.8rem;
        box-shadow: 0 2px 8px #0001;
        margin-bottom: 1.1rem;
        padding: 1rem 1.1rem;
      }
      .mobile-pergunta-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.95em;
      }
      .mobile-pergunta-num {
        font-weight: 700;
        color: #38b6a5;
        font-size: 1.1em;
      }
      .mobile-pergunta-media {
        font-size: 0.98em;
        color: #2d3a41;
      }
      .mobile-pergunta-texto {
        margin-bottom: 0.6rem;
        font-size: 1em;
        color: #222;
      }
      .mobile-actions {
        margin-top: 0.5rem;
      }
      /* Barra de distribuição mais "grossa" conforme solicitado */
      .dist-bar {
        width: 360px;
        max-width: 100%;
        min-width: 160px;
        height: 24px;
        border-radius: 0.45rem;
        overflow: hidden;
        background: #f1f5f7;
        position: relative;
        transition: width 0.2s;
      }
      .dist-label {
        position: absolute;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.55rem;
        font-weight: 600;
        pointer-events: none;
      }
      .erro {
        background: #ffe9e9;
        border: 1px solid #ffc5c5;
        color: #d93030;
        padding: 0.7rem 0.9rem;
        border-radius: 0.7rem;
        font-size: 0.8rem;
        margin-bottom: 1rem;
      }
      .nps-bloqueado {
        background: #fff8e1;
        border: 1px solid #ffe1a3;
        color: #8a6400;
        padding: 0.55rem 0.75rem;
        border-radius: 0.6rem;
        font-size: 0.7rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      @media (max-width: 700px) {
        .relatorio-page {
          padding: 1.1rem 0.3rem 1.5rem 0.3rem;
          margin-top: 4.2rem;
        }
        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.7rem;
        }
        .meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.7rem;
          padding: 0.8rem 0.5rem;
        }
        .meta-row {
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
          gap: 0.7rem;
          width: 100%;
        }
        /* Mobile: ocultar a grade de 11 colunas da distribuição NPS e manter apenas os resumos */
        .dist-nps {
          display: none !important;
        }
        .tbl-perguntas,
        .tbl-perguntas thead,
        .tbl-perguntas tbody,
        .tbl-perguntas tr,
        .tbl-perguntas th,
        .tbl-perguntas td {
          display: none !important;
        }
        .mobile-perguntas {
          display: block;
        }
        .mobile-bar {
          display: block;
          margin-top: 0.4rem;
        }
      }
      /* micro ajuste para telas ultra estreitas */
      /* Breakpoint para telas ultra estreitas permanece, mas a grade já está oculta acima */
      @media (max-width: 360px) {
      }
      /* Modal básico (reutilizando estilos existentes do cadastro) */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        backdrop-filter: saturate(120%) blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 9999;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      .modal-card {
        width: min(960px, calc(100vw - 2rem));
        max-width: 960px;
        max-height: calc(100vh - 1.5rem);
        overflow-y: auto;
        overflow-x: hidden;
        background: #fff;
        border: 1px solid #dfe9ee;
        border-radius: 0.9rem;
        box-shadow: 0 10px 24px #0000002a;
        padding: 0.8rem 0.9rem;
        display: flex;
        flex-direction: column;
      }
      .md-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .mini-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 70vh;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .modal-question {
        font-size: 0.9rem;
        color: #234;
        margin: 0 0 0.5rem 0;
      }
      .mini-list .row {
        background: #f9fbfc;
        border: 1px solid #e7f1f5;
        padding: 0.55rem 0.6rem;
        border-radius: 0.6rem;
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
      }
      .idx-badge {
        flex: 0 0 auto;
        min-width: 26px;
        height: 26px;
        padding: 0 .5rem;
        border-radius: 999px;
        background: #e7f0ff;
        color: #2b5fa8;
        font-weight: 700;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        user-select: none;
      }
      .mini-list .txt {
        font-size: 0.95rem;
        color: #1f2d32;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: anywhere;
        line-height: 1.4;
      }
      .placeholder {
        background: #f5f8fa;
        border: 1px dashed #c7d5db;
        color: #5a6b71;
        font-size: 0.9rem;
        padding: 0.85rem 0.9rem;
        border-radius: 0.55rem;
        text-align: center;
      }
    `,
  ],
})
export class RelatorioPesquisaComponent {
  report: any = null;
  erro = "";
  loaded = false;
  departments: any[] = [];
  selectedDepartmentId: number | undefined;
  private searchId = 0;
  // modal respostas qualitativas
  showTextModal = false;
  loadingTextAnswers = false;
  textAnswers: { texto: string }[] = [];
  textQuestionTitle = '';
  textTotal = 0;
  textMinThreshold = 0;
  constructor(
    private route: ActivatedRoute,
    private search: SearchService,
    private dept: DepartmentService
  ) {}
  ngOnInit() {
    this.searchId = Number(this.route.snapshot.paramMap.get("id"));
    if (!this.searchId) {
      this.erro = "ID inválido";
      this.loaded = true;
      return;
    }
    this.dept.getAll().subscribe({ next: (d) => (this.departments = d || []), error: () => {} });
    this.reload();
  }
  reload() {
    this.loaded = false;
    this.search.getReport(this.searchId, this.selectedDepartmentId).subscribe({
      next: (data) => {
        this.report = data;
        this.loaded = true;
      },
      error: () => {
        this.erro = "Erro ao carregar relatório";
        this.loaded = true;
      },
    });
  }
  clearDept() {
    this.selectedDepartmentId = undefined;
    this.reload();
  }
  currentDepartmentName() {
    if (!this.selectedDepartmentId) return "";
    const dep = this.departments.find((d) => d.id === this.selectedDepartmentId);
    return dep?.name || this.report?.department?.name || "Setor";
  }
  pct(count: any): string {
    if (!this.report?.totalRespondentes) return "0%";
    const c = Number(count) || 0;
    return ((c / this.report.totalRespondentes) * 100).toFixed(1) + "%";
  }
  npsKeys() {
    return this.report?.npsDistribuicao ? Object.keys(this.report.npsDistribuicao) : [];
  }
  distEntries(dist: any) {
    return Object.keys(dist || {})
      .map((k) => ({ key: k, ...dist[k] }))
      .sort((a, b) => Number(a.key) - Number(b.key));
  }
  // Funções para gerar gradient e labels
  buildStack(_: any, __?: string) {
    return [];
  }

  gradientSegments(dist: any, tipo?: string) {
    if (!dist) return [];
    const scores = tipo === "clima" ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const raw = scores
      .map((s) => {
        const entry = dist[String(s)] || { percent: 0 };
        const percent = typeof entry.percent === "number" ? entry.percent : 0;
        return { score: s, percent, color: this.getScoreBandColor(s, tipo) };
      })
      .filter((r) => r.percent > 0);
    // Merge adjacentes de mesma cor
    const merged: { color: string; percent: number; scores: number[] }[] = [];
    raw.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && last.color === r.color) {
        last.percent += r.percent;
        last.scores.push(r.score);
      } else {
        merged.push({ color: r.color, percent: r.percent, scores: [r.score] });
      }
    });
    let acc = 0;
    return merged.map((m) => {
      const start = acc;
      acc += m.percent;
      const end = acc > 100 ? 100 : acc;
      const width = end - start;
      return {
        start,
        end,
        width,
        percent: m.percent,
        color: m.color,
        textColor: m.color === "#fbc02d" ? "#2d2d2d" : "#fff",
      };
    });
  }

  gradientBackground(dist: any, tipo?: string) {
    const segments = this.gradientSegments(dist, tipo);
    if (!segments.length) return "#f1f5f7";
    const stops: string[] = [];
    segments.forEach((m) => {
      stops.push(`${m.color} ${m.start.toFixed(2)}%`, `${m.color} ${m.end.toFixed(2)}%`);
    });
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }
  getScoreBandColor(score: number, tipo?: string) {
    // Escala pulso (0-10) -> Detratores 0-6 (vermelho), Neutros 7-8 (amarelo), Promotores 9-10 (verde)
    // Escala clima (1-5) -> 1-2 vermelho, 3 amarelo, 4-5 verde
    if (tipo === "clima") {
      if (score <= 2) return "#e53935";
      if (score === 3) return "#fbc02d";
      return "#43a047";
    }
    if (score <= 6) return "#e53935";
    if (score <= 8) return "#fbc02d";
    return "#43a047";
  }
  getNpsColor(n: number) {
    if (n >= 75) return "#2e7d32";
    if (n >= 50) return "#38b6a5";
    if (n >= 0) return "#fbc02d";
    return "#ff7043";
  }
  formatPercent(p: any) {
    const n = Number(p);
    if (isNaN(n)) return "-";
    if (n === 0) return "0%";
    if (n < 1) return n.toFixed(2).replace(/0$/, "") + "%";
    return Number.isInteger(n) ? n.toFixed(0) + "%" : n.toFixed(1) + "%";
  }
  formatDate(d: any) {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }
  canShowNps() {
    if (this.report?.tipo !== "pulso") return false;
    if (this.report?.nps === null || this.report?.nps === undefined) return false;
    const total = this.report?.totalRespondentes || 0;
    if (total < 2) return false; // bloqueia se menos de 2 respondentes, geral ou setor
    return true;
  }
  canShowPerguntas() {
    const total = this.report?.totalRespondentes || 0;
    if (total < 2) return false;
    return true;
  }
  openTextAnswersModal(index: number, questionText: string) {
    this.showTextModal = true;
    this.loadingTextAnswers = true;
    this.textAnswers = [];
    this.textQuestionTitle = questionText;
    this.search
      .getTextAnswers(this.searchId, index, this.selectedDepartmentId)
      .subscribe({
        next: (res: any) => {
          this.textAnswers = res?.respostas || [];
          this.textTotal = res?.total || 0;
          this.textMinThreshold = res?.min || 0;
          this.loadingTextAnswers = false;
        },
        error: () => {
          this.textAnswers = [];
          this.textTotal = 0;
          this.textMinThreshold = 0;
          this.loadingTextAnswers = false;
        },
      });
  }
  closeTextAnswersModal() {
    this.showTextModal = false;
  }
  showSegPercent(_: any) {
    return false;
  }
  scoreClasse(k: string) {
    const v = Number(k);
    if (isNaN(v)) return "";
    if (v <= 6) return "detrator";
    if (v <= 8) return "neutro";
    return "promotor";
  }
  scoreTooltip(k: string) {
    const v = Number(k);
    if (isNaN(v)) return "";
    let cat = v <= 6 ? "Detrator" : v <= 8 ? "Neutro" : "Promotor";
    const count = this.report?.npsDistribuicao?.[k]?.count || 0;
    const percent = this.report?.npsDistribuicao?.[k]?.percent || 0;
    return `Nota ${k} • ${count} respostas • ${this.formatPercent(percent)} • ${cat}`;
  }
}
