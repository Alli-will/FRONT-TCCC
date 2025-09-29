import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { resolveApiBase } from "./api-base";

@Injectable({ providedIn: "root" })
export class QuestionService {
  private primaryBase = resolveApiBase();
  private remoteBase = "https://tcc-main.up.railway.app";
  private apiUrl = `${this.primaryBase}/questions`;

  constructor(private http: HttpClient) {}

  private withFallback<T>(req: Observable<T>, buildRemote: () => Observable<T>): Observable<T> {
    return req.pipe(
      catchError((err) => {
        if (err.status === 0 || err.status === 404) {
          return buildRemote();
        }
        return throwError(() => err);
      })
    );
  }

  list(params?: any): Observable<any> {
    const q = new URLSearchParams(params || {}).toString();
    const url = q ? `${this.apiUrl}?${q}` : this.apiUrl;
    return this.withFallback(this.http.get(url), () =>
      this.http.get(q ? `${this.remoteBase}/questions?${q}` : `${this.remoteBase}/questions`)
    );
  }

  create(data: {
    texto: string;
    descricaoBusca?: string;
    modalidade: "pulso" | "clima";
    tipoResposta: "qualitativa" | "quantitativa";
  }): Observable<any> {
    return this.withFallback(this.http.post(this.apiUrl, data), () =>
      this.http.post(`${this.remoteBase}/questions`, data)
    );
  }

  update(id: number, data: any): Observable<any> {
    return this.withFallback(this.http.patch(`${this.apiUrl}/${id}`, data), () =>
      this.http.patch(`${this.remoteBase}/questions/${id}`, data)
    );
  }

  remove(id: number): Observable<any> {
    return this.withFallback(this.http.delete(`${this.apiUrl}/${id}`), () =>
      this.http.delete(`${this.remoteBase}/questions/${id}`)
    );
  }

  get(id: number): Observable<any> {
    return this.withFallback(this.http.get(`${this.apiUrl}/${id}`), () =>
      this.http.get(`${this.remoteBase}/questions/${id}`)
    );
  }
}
