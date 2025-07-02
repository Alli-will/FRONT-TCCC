import { Component, OnInit } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [MenuComponent, CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  colaboradoresAtivos: any[] = [];
  loading = true;
  erro: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.colaboradoresAtivos = (users || [])
          .filter((u: any) => u.ativo !== false)
          .map((u: any) => ({
            nomeCompleto: (u.first_Name || '') + ' ' + (u.last_Name || ''),
            departamento: u.departamento || u.department || 'Departamento não definido'
          }));
        console.log('Colaboradores ativos (nome e departamento):', this.colaboradoresAtivos);
        this.loading = false;
      },
      error: (err) => {
        this.erro = 'Erro ao carregar colaboradores.';
        this.loading = false;
      }
    });
  }
}
