import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, catchError, throwError, of } from "rxjs";
import { tap } from "rxjs/operators";
import { resolveApiBase } from './api-base';

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // Base da API (produção). Avalie mover para um arquivo de environment.
  private primaryBase = resolveApiBase();
  private remoteBase = 'https://tcc-main.up.railway.app';
  private apiUrl = `${this.primaryBase}/auth`;
  private currentUserSubject: BehaviorSubject<string | null>;
  public currentUser: Observable<string | null>;

  constructor(private http: HttpClient) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    this.currentUserSubject = new BehaviorSubject<string | null>(token);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  login(email: string, password: string): Observable<any> {
    const payload = { email, password };
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, payload).pipe(
      catchError(err => {
        if ([0, 404, 405].includes(err?.status)) {
          return this.http.post<{ token: string }>(`${this.remoteBase}/auth/login`, payload);
        }
        return throwError(() => err);
      }),
      tap(response => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", response.token);
          this.currentUserSubject.next(response.token);
        }
      })
    );
  }

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
    this.currentUserSubject.next(null);
    window.location.reload(); 
  }

  get currentUserValue(): string | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getUserInfoFromToken(): any {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  isAdmin(): boolean {
    const info = this.getUserInfoFromToken();
    return info?.role === 'admin';
  }

  isSupport(): boolean {
    const info = this.getUserInfoFromToken();
    return info?.role === 'support';
  }
}
