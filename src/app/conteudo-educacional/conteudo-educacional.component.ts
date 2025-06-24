import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuComponent } from "../menu/menu.component";

interface Conteudo {
  titulo: string;
  descricao: string;
  tipo: "Vídeo" | "Texto" | "Áudio";
  tempo: string;
  categoria: string;
  badge: string;
  modalTitulo: string;
  modalDescricao: string;
}

@Component({
  selector: "app-conteudo-educacional",
  standalone: true,
  imports: [CommonModule, MenuComponent],
  templateUrl: "./conteudo-educacional.component.html",
  styleUrls: ["./conteudo-educacional.component.css"],
})
export class ConteudoEducacionalComponent {
  conteudos: Conteudo[] = [
    {
      titulo: "Exercícios rápidos para fazer na mesa de trabalho",
      descricao:
        "Vídeo demonstrando exercícios simples que ajudam a aliviar o estresse e melhorar o bem-estar no trabalho.",
      tipo: "Vídeo",
      tempo: "7 min",
      categoria: "Bem-estar",
      badge: "Bem-estar",
      modalTitulo: "Exercícios rápidos para fazer na mesa de trabalho",
      modalDescricao:
        "Vídeo com exercícios simples para aliviar o estresse e melhorar o bem-estar no ambiente de trabalho. Pratique diariamente para melhores resultados.",
    },
    {
      titulo: "Ansiedade no trabalho",
      descricao:
        "Dicas práticas para lidar com ansiedade em situações profissionais.",
      tipo: "Texto",
      tempo: "",
      categoria: "Ansiedade",
      badge: "Ansiedade",
      modalTitulo: "Ansiedade no trabalho",
      modalDescricao:
        "A ansiedade no trabalho é comum e pode ser causada por prazos, cobranças ou reuniões importantes. Técnicas de respiração, pausas curtas e organização das tarefas ajudam a controlar os sintomas. Se persistir, procure apoio profissional.",
    },
    {
      titulo: "Crise de ansiedade",
      descricao:
        "Áudio de um relato real sobre uma crise de ansiedade e como superá-la.",
      tipo: "Áudio",
      tempo: "2 min",
      categoria: "Ansiedade",
      badge: "Ansiedade",
      modalTitulo: "Crise de ansiedade",
      modalDescricao:
        "Relato real sobre uma crise de ansiedade, com dicas de como superar e buscar ajuda. Ouça e compartilhe com quem precisa.",
    },
  ];

  modalOpen = false;
  conteudoSelecionado: Conteudo | null = null;

  abrirModal(conteudo: Conteudo) {
    this.conteudoSelecionado = conteudo;
    this.modalOpen = true;
  }

  fecharModal() {
    this.modalOpen = false;
    this.conteudoSelecionado = null;
  }
}
