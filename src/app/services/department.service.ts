import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, catchError, throwError, shareReplay, tap } from "rxjs";
import { resolveApiBase } from "./api-base";

@Injectable({ providedIn: "root" })
export class DepartmentService {
  private primaryBase = resolveApiBase();
  private remoteBase = "https://tcc-main.up.railway.app";
  private apiUrl = `${this.primaryBase}/departments`;
  private cache: any[] | null = null;
  private inflight$?: Observable<any[]>;

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

  getAll(): Observable<any[]> {
    if (this.cache) return of(this.cache);
    if (this.inflight$) return this.inflight$;
    const req = this.withFallback(this.http.get<any[]>(this.apiUrl), () =>
      this.http.get<any[]>(`${this.remoteBase}/departments`)
    ).pipe(
      tap((rows) => (this.cache = rows || [])),
      shareReplay(1)
    );
    this.inflight$ = req as Observable<any[]>;
    return req;
  }
  create(name: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { name });
  }
  update(id: number, body: { name: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, body);
  }
  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
