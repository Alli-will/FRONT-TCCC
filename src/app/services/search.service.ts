import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { resolveApiBase } from "./api-base";

@Injectable({ providedIn: "root" })
export class SearchService {
  private primaryBase = resolveApiBase();
  private remoteBase = "https://tcc-main.up.railway.app";
  private apiUrl = `${this.primaryBase}/searches`;

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

  createSearch(data: { titulo: string; tipo: string; perguntas?: any[] }): Observable<any> {
    return this.withFallback(this.http.post(this.apiUrl, data), () =>
      this.http.post(`${this.remoteBase}/searches`, data)
    );
  }

  getAllSearches(page = 1, limit = 20, all = false): Observable<any> {
    const url = this.apiUrl + `?page=${page}&limit=${limit}` + (all ? "&all=1" : "");
    return this.withFallback(this.http.get(url), () =>
      this.http.get(`${this.remoteBase}/searches?page=${page}&limit=${limit}${all ? "&all=1" : ""}`)
    );
  }

  getSearchById(id: number): Observable<any> {
    return this.withFallback(this.http.get(`${this.apiUrl}/${id}`), () =>
      this.http.get(`${this.remoteBase}/searches/${id}`)
    );
  }

  respondSearch(payload: { searchId: number; answers: any[] }): Observable<any> {
    return this.withFallback(this.http.post(`${this.apiUrl}/respond`, payload), () =>
      this.http.post(`${this.remoteBase}/searches/respond`, payload)
    );
  }

  getDefaultQuestions(tipo?: "pulso" | "clima"): Observable<any> {
    const q = tipo ? `?tipo=${tipo}` : "";
    return this.withFallback(this.http.get(`${this.apiUrl}/defaults/questions${q}`), () =>
      this.http.get(`${this.remoteBase}/searches/defaults/questions${q}`)
    );
  }

  getReport(id: number, departmentId?: number): Observable<any> {
    const q = departmentId ? `?departmentId=${departmentId}` : "";
    return this.withFallback(this.http.get(`${this.apiUrl}/${id}/report${q}`), () =>
      this.http.get(`${this.remoteBase}/searches/${id}/report${q}`)
    );
  }
}
