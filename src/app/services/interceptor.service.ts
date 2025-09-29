import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isExpired = (tk: string | null) => {
    if (!tk) return true;
    try {
      const payload = JSON.parse(atob(tk.split(".")[1]));
      if (!payload?.exp) return false;
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  };

  const redirectLogin = (clear = true) => {
    if (clear) {
      try {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      } catch {}
    }
    if (!/\/login$/.test(location.pathname)) router.navigate(["/login"]);
  };

  // Checa offline imediatamente
  // Não redireciona em offline se já está na tela de login ou não há token
  if (typeof navigator !== "undefined" && navigator && navigator.onLine === false) {
    if (token && !/\/login$/.test(location.pathname)) redirectLogin();
  }

  if (token && isExpired(token)) redirectLogin();

  const authReq =
    token && !isExpired(token)
      ? req.clone({ headers: req.headers.set("Authorization", `Bearer ${token}`) })
      : req;

  return next(authReq).pipe(
    catchError((err: any) => {
      // HttpErrorResponse ou erro genérico (fetch TypeError)
      if (err instanceof HttpErrorResponse) {
        if ([0, 401, 403].includes(err.status)) {
          // Só redireciona em erro de rede se havia token; evita loop ao carregar login offline
          if (err.status === 0 && !token) return throwError(() => err);
          redirectLogin();
        }
      } else {
        // Erro genérico (ex.: TypeError: Failed to fetch)
        const msg = (err?.message || "").toLowerCase();
        if ((msg.includes("failed to fetch") || msg.includes("network")) && token) redirectLogin();
      }
      return throwError(() => err);
    })
  );
};
