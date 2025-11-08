import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { resolveApiBase } from "./api-base";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private primaryBase = resolveApiBase();
  // Fallback remoto (produção)
  private remoteBase = "https://tcc-main.up.railway.app";
  private apiUrl = `${this.primaryBase}/dashboard/metrics`;

  constructor(private http: HttpClient) {}

  private withFallback<T>(req: Observable<T>, remote: () => Observable<T>) {
    return req.pipe(
      catchError((err) => {
        if (err.status === 0 || err.status === 404) return remote();
        return throwError(() => err);
      })
    );
  }

  getMetrics(params?: { days?: number; since?: string; until?: string }): Observable<any> {
    let p = new HttpParams();
    if (params?.days) p = p.set("days", String(params.days));
    if (params?.since) p = p.set("since", params.since);
    if (params?.until) p = p.set("until", params.until);
    return this.withFallback(this.http.get<any>(this.apiUrl, { params: p }), () =>
      this.http.get<any>(`${this.remoteBase}/dashboard/metrics`, { params: p })
    );
  }

  getEssGeral() {
    return this.withFallback(
      this.http.get<{ ess: number; valores: number[] }>(`${this.primaryBase}/dashboard/ess-geral`),
      () =>
        this.http.get<{ ess: number; valores: number[] }>(`${this.remoteBase}/dashboard/ess-geral`)
    );
  }

  getClimaMetrics(params?: { days?: number; since?: string; until?: string }) {
    let p = new HttpParams();
    if (params?.days) p = p.set("days", String(params.days));
    if (params?.since) p = p.set("since", params.since);
    if (params?.until) p = p.set("until", params.until);
    const local = `${this.primaryBase}/dashboard/clima/metrics`;
    const remote = `${this.remoteBase}/dashboard/clima/metrics`;
    return this.withFallback(this.http.get<any>(local, { params: p }), () =>
      this.http.get<any>(remote, { params: p })
    );
  }

  // Diário removido: retornar array vazio para evitar 404 até remover uso no componente
  getEmotionPercentages(): Observable<any> {
    return new Observable((observer) => {
      observer.next([]);
      observer.complete();
    });
  }
}
