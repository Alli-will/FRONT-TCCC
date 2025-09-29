import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MenuComponent } from "../menu/menu.component";
import { FormsModule } from "@angular/forms";
import { UserService } from "../services/user.service";
import { DepartmentService } from "../services/department.service";
import { AuthService } from "../services/auth.service";
import { resolveApiBase } from "../services/api-base";

@Component({
  selector: "app-usuarios",
  standalone: true,
  imports: [MenuComponent, CommonModule, RouterModule, FormsModule],
  templateUrl: "./usuarios.component.html",
  styleUrls: ["./usuarios.component.css"],
})
export class UsuariosComponent implements OnInit, OnDestroy {
  colaboradoresAtivos: any[] = [];
  departamentos: any[] = [];
  erro = "";
  loading = true;
  isAdmin = false;
  editandoId: number | null = null;
  // valor temporário do departamento enquanto edita
  tempEditDeptId: number | null = null;
  salvandoDept = false;
  private avatarObjectUrls: string[] = [];
  // Banner topo (feedback)
  mensagem: string | null = null;
  bannerTipo: "sucesso" | "erro" = "sucesso";
  private bannerTimer: any = null;
  // Modal de confirmação
  confirmOpen = false;
  confirmTarget: any = null;
  confirmMode: "delete" | "inactivate" | "activate" = "delete";
  deleting = false;
  toggling = false;

  // Paginação
  paginaAtual = 1;
  itensPorPagina = 10;
  // Filtro de status
  status: "ativos" | "inativos" | "todos" = "ativos";

  get totalPaginas(): number {
    return Math.ceil(this.colaboradoresAtivos.length / this.itensPorPagina) || 1;
  }

  get colaboradoresPaginados(): any[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.colaboradoresAtivos.slice(inicio, inicio + this.itensPorPagina);
  }

  paginaAnterior() {
    if (this.paginaAtual > 1) this.paginaAtual--;
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas) this.paginaAtual++;
  }

  irParaPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) this.paginaAtual = p;
  }

  constructor(
    private userService: UserService,
    private deptService: DepartmentService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.auth.isAdmin();
    // Carrega departamentos
    this.deptService.getAll().subscribe({
      next: (d) => (this.departamentos = d || []),
      error: () => {},
    });
    // Carrega usuários (padrão: ativos)
    this.userService.getUsersByStatus(this.status).subscribe({
      next: (users: any[]) => {
        const mapped = (users || []).map((u: any) => {
          const dept = this.extractDepartment(u);
          return {
            id: u.id,
            nomeCompleto:
              `${u.first_Name || u.firstName || ""} ${u.last_Name || u.lastName || ""}`.trim() ||
              u.nome ||
              u.name ||
              u.email ||
              "Sem nome",
            departamento: dept.name,
            departmentId: dept.id,
            ativo: u.ativo,
            avatarUrl: null,
            _etag: null,
            _objectUrl: null,
          };
        });
        // Aplica filtro de status no front (reforço visual)
        this.colaboradoresAtivos =
          this.status === "ativos"
            ? mapped.filter((c: any) => c.ativo !== false)
            : this.status === "inativos"
              ? mapped.filter((c: any) => c.ativo === false)
              : mapped;
        this.loading = false;
        // Carrega avatares em background sem reativar tela de loading para evitar flicker
        setTimeout(() => this.carregarAvatares(false), 0);
      },
      error: () => {
        this.erro = "Erro ao carregar colaboradores.";
        this.loading = false;
      },
    });
  }

  onStatusChange() {
    this.loading = true;
    this.paginaAtual = 1;
    this.userService.getUsersByStatus(this.status).subscribe({
      next: (users: any[]) => {
        const mapped = (users || []).map((u: any) => {
          const dept = this.extractDepartment(u);
          return {
            id: u.id,
            nomeCompleto:
              `${u.first_Name || u.firstName || ""} ${u.last_Name || u.lastName || ""}`.trim() ||
              u.nome ||
              u.name ||
              u.email ||
              "Sem nome",
            departamento: dept.name,
            departmentId: dept.id,
            ativo: u.ativo,
            avatarUrl: null,
            _etag: null,
            _objectUrl: null,
          };
        });
        this.colaboradoresAtivos =
          this.status === "ativos"
            ? mapped.filter((c: any) => c.ativo !== false)
            : this.status === "inativos"
              ? mapped.filter((c: any) => c.ativo === false)
              : mapped;
        this.loading = false;
        setTimeout(() => this.carregarAvatares(false), 0);
      },
      error: () => {
        this.erro = "Erro ao carregar colaboradores.";
        this.loading = false;
      },
    });
  }

  private isValidBase64(s: string): boolean {
    if (!s || typeof s !== "string") return false;
    try {
      return btoa(atob(s)) === s.replace(/\s/g, "");
    } catch {
      return false;
    }
  }

  private carregarAvatares(blockGlobal = false) {
    const token = localStorage.getItem("token");
    if (!token) return;
    const localBase = resolveApiBase();
    const remoteBase = "https://tcc-main.up.railway.app";
    let apiBase = localBase;
    const tasks: Promise<void>[] = [];
    this.colaboradoresAtivos.forEach((c: any) => {
      if (!c.id) return;
      const ts = Date.now();
      const task = (async () => {
        try {
          let metaResp = await fetch(`${apiBase}/user/${c.id}/avatar/meta?ts=${ts}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!metaResp.ok) {
            // tenta remoto
            metaResp = await fetch(`${remoteBase}/user/${c.id}/avatar/meta?ts=${ts}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!metaResp.ok) throw new Error("meta");
            apiBase = remoteBase;
          }
          const meta = await metaResp.json();
          if (!meta?.hasAvatar) return;
          // Debug temporário
          // console.debug('Avatar meta', c.id, meta);

          if (meta.etag && c._etag === meta.etag && c._objectUrl) {
            c.avatarUrl = c._objectUrl;
            this.cdr.detectChanges();
            return;
          }

          const headers: any = { Authorization: `Bearer ${token}` };
          if (c._etag) headers["If-None-Match"] = `"${c._etag}"`;
          let resp = await fetch(`${apiBase}/user/${c.id}/avatar?ts=${ts}`, { headers });
          if (!resp.ok) {
            // fallback remoto
            resp = await fetch(`${remoteBase}/user/${c.id}/avatar?ts=${ts}`, { headers });
            if (resp.ok) apiBase = remoteBase;
          }
          if (resp.status === 304 && !c._objectUrl) {
            resp = await fetch(`${apiBase}/user/${c.id}/avatar?ts=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          if (resp.status === 204) return;
          if (!resp.ok) throw new Error("blob");
          c._etag = meta.etag || null;
          const blob = await resp.blob();
          if (!blob || (blob as any).size === 0) return;
          // Diagnóstico: se o tipo não bate com meta.mimeType ou parece texto, tenta debug
          const ctype = resp.headers.get("Content-Type") || "";
          const looksText = ctype.includes("text") || ctype.includes("json");
          if (looksText || (blob as any).size < 50) {
            try {
              const dbg = await fetch(`${apiBase}/user/${c.id}/avatar/debug?ts=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (dbg.ok) {
                const info = await dbg.json();
                // eslint-disable-next-line no-console
                console.warn("Avatar debug", c.id, info);
              }
            } catch {}
          }
          if (c._objectUrl) URL.revokeObjectURL(c._objectUrl);
          const enforcedBlob =
            meta.mimeType && blob.type !== meta.mimeType
              ? new Blob([blob], { type: meta.mimeType })
              : blob;
          const objUrl = URL.createObjectURL(enforcedBlob);
          c._objectUrl = objUrl;
          c.avatarUrl = objUrl;
          this.avatarObjectUrls.push(objUrl);
          this.cdr.detectChanges();
        } catch (err) {
          // console.warn('Falha avatar fluxo principal', c.id, err);
          try {
            const r = await fetch(`${apiBase}/user/${c.id}/avatar/base64?ts=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
              const data = await r.json();
              if (
                data?.hasAvatar &&
                typeof data.base64 === "string" &&
                this.isValidBase64(data.base64)
              ) {
                const mime = data.mimeType || "image/png";
                c.avatarUrl = `data:${mime};base64,${data.base64}`;
                this.cdr.detectChanges();
                return;
              }
            }
          } catch {}
          try {
            const r2 = await fetch(`${apiBase}/user/${c.id}/avatar?ts=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r2.ok) {
              const blob2: Blob = await r2.blob();
              if (!blob2 || (blob2 as any).size === 0) return;
              if (c._objectUrl) URL.revokeObjectURL(c._objectUrl);
              const url2 = URL.createObjectURL(blob2);
              c._objectUrl = url2;
              c.avatarUrl = url2;
              this.avatarObjectUrls.push(url2);
              this.cdr.detectChanges();
            }
          } catch {}
        }
      })();
      tasks.push(task);
    });
    // bloco global removido para não exibir loader tardio
  }

  ngOnDestroy(): void {
    this.avatarObjectUrls.forEach((u) => URL.revokeObjectURL(u));
  }

  // Feedback
  dismissBanner() {
    this.mensagem = null;
  }
  private showBanner(msg: string, tipo: "sucesso" | "erro") {
    this.mensagem = msg;
    this.bannerTipo = tipo;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.mensagem = null;
      this.bannerTimer = null;
    }, 2500);
  }

  iniciarEdicao(c: any) {
    if (!this.isAdmin) return;
    this.editandoId = c.id;
    // pré-seleciona o departamento atual
    this.tempEditDeptId = c.departmentId ?? null;
  }

  cancelarEdicao() {
    this.editandoId = null;
    this.tempEditDeptId = null;
  }

  confirmarDepartamento(c: any) {
    // confirma utilizando o valor temporário escolhido no seletor
    this.salvarDepartamento(c, this.tempEditDeptId);
  }

  salvarDepartamento(c: any, novoDeptId: number | null | undefined) {
    if (!this.isAdmin) return;
    const deptId = novoDeptId !== undefined && novoDeptId !== null ? Number(novoDeptId) : null;
    this.salvandoDept = true;
    const localBase = resolveApiBase();
    const remoteBase = "https://tcc-main.up.railway.app";
    const tryUpdate = async (base: string) =>
      fetch(`${base}/user/${c.id}/department`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ departmentId: deptId }),
      });
    tryUpdate(localBase)
      .then((r) =>
        r.ok ? r.json() : tryUpdate(remoteBase).then((r2) => (r2.ok ? r2.json() : Promise.reject()))
      )
      .then((resp) => {
        if (resp?.user) {
          const dept = this.extractDepartment(resp.user);
          c.departamento = dept.name;
          c.departmentId = dept.id;
        }
        this.editandoId = null;
        this.tempEditDeptId = null;
      })
      .catch(() => {})
      .finally(() => {
        this.salvandoDept = false;
      });
  }

  // Ações: Ativar/Inativar/Excluir
  openConfirmInactivate(c: any) {
    if (!this.isAdmin) return;
    this.confirmTarget = c;
    this.confirmMode = "inactivate";
    this.confirmOpen = true;
    try {
      document.body.classList.add("body-lock");
    } catch {}
  }
  openConfirmActivate(c: any) {
    if (!this.isAdmin) return;
    this.confirmTarget = c;
    this.confirmMode = "activate";
    this.confirmOpen = true;
    try {
      document.body.classList.add("body-lock");
    } catch {}
  }
  openConfirmDelete(c: any) {
    if (!this.isAdmin) return;
    this.confirmTarget = c;
    this.confirmMode = "delete";
    this.confirmOpen = true;
    try {
      document.body.classList.add("body-lock");
    } catch {}
  }
  closeConfirm() {
    this.confirmOpen = false;
    this.confirmTarget = null;
    this.confirmMode = "delete";
    try {
      document.body.classList.remove("body-lock");
    } catch {}
  }
  confirmarAcao() {
    if (!this.confirmTarget) return;
    const c = this.confirmTarget;
    if (this.confirmMode === "delete") {
      if (this.deleting) return;
      this.deleting = true;
      this.userService.deleteUser(c.id).subscribe({
        next: () => {
          this.colaboradoresAtivos = this.colaboradoresAtivos.filter((x) => x.id !== c.id);
          this.showBanner("Usuário excluído com sucesso.", "sucesso");
          this.closeConfirm();
        },
        error: (e) => {
          const msg =
            e?.error?.error ||
            e?.error?.message ||
            "Não foi possível excluir. Se houver registros, inative o usuário.";
          this.showBanner(msg, "erro");
          this.closeConfirm();
        },
        complete: () => {
          this.deleting = false;
        },
      });
    } else {
      const ativo = this.confirmMode === "activate";
      if (this.toggling) return;
      this.toggling = true;
      this.userService.setActive(c.id, ativo).subscribe({
        next: () => {
          // Atualiza visualmente com suposição de campo ativo; se não houver backend pronto, só exibe banner
          (c as any).ativo = ativo;
          // Remove da lista se saiu do filtro atual
          if ((this.status === "ativos" && !ativo) || (this.status === "inativos" && ativo)) {
            this.colaboradoresAtivos = this.colaboradoresAtivos.filter((x) => x.id !== c.id);
          }
          this.showBanner(ativo ? "Usuário ativado." : "Usuário inativado.", "sucesso");
          this.closeConfirm();
        },
        error: (e) => {
          const msg = e?.error?.error || e?.error?.message || "Falha ao atualizar status.";
          this.showBanner(msg, "erro");
          this.closeConfirm();
        },
        complete: () => {
          this.toggling = false;
        },
      });
    }
  }

  // Extrai nome/id do departamento de diferentes formatos
  private extractDepartment(u: any): { name: string; id: number | null } {
    const raw = u?.department ?? u?.departamento ?? u?.dept ?? null;
    let name = "";
    let id: number | null = null;
    if (typeof raw === "string") {
      name = raw;
    } else if (raw && typeof raw === "object") {
      name =
        raw.name ||
        raw.nome ||
        raw.title ||
        raw.label ||
        raw.departmentName ||
        raw.description ||
        "";
      if (raw.id != null) {
        const n = Number(raw.id);
        id = isNaN(n) ? null : n;
      }
    }
    if (!name) name = u?.departmentName || u?.department_name || "Departamento não definido";
    if (id == null) {
      const n2 = u?.departmentId ?? u?.department_id;
      id = n2 != null && !isNaN(Number(n2)) ? Number(n2) : null;
    }
    return { name: name || "Departamento não definido", id };
  }
}
