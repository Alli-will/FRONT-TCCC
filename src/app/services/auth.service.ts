import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, catchError, throwError, of } from "rxjs";
import { tap } from "rxjs/operators";
import { resolveApiBase } from "./api-base";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private primaryBase = resolveApiBase();
  private remoteBase = "https://tcc-main.up.railway.app";
  private apiUrl = `${this.primaryBase}/auth`;
  private currentUserSubject: BehaviorSubject<string | null>;
  public currentUser: Observable<string | null>;

  constructor(private http: HttpClient) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    this.currentUserSubject = new BehaviorSubject<string | null>(token);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  login(email: string, password: string): Observable<any> {
    const payload = { email, password };
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, payload).pipe(
      catchError((err) => {
        if ([0, 404, 405].includes(err?.status)) {
          return this.http.post<{ token: string }>(`${this.remoteBase}/auth/login`, payload);
        }
        return throwError(() => err);
      }),
      tap((response) => {
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
      try {
        localStorage.removeItem("avatarUpdatedTs");
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { ts: Date.now() } }));
      } catch {}
    }
    this.currentUserSubject.next(null);
    window.location.reload();
  }

  get currentUserValue(): string | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.currentUserSubject.value;
    if (!token) return false;
    const payload = this.safeDecodePayload(token);
    if (!payload) return false;
    const exp = payload.exp;
    if (typeof exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (exp < nowSec) {
        try { localStorage.removeItem('token'); } catch {}
        this.currentUserSubject.next(null);
        return false;
      }
    }
    return true;
  }

  getUserInfoFromToken(): any {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return null;
    return this.safeDecodePayload(token);
  }

  private safeDecodePayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1];
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      const json = atob(payload);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isAdmin(): boolean {
    const info = this.getUserInfoFromToken();
    return info?.role === "admin";
  }

  isSupport(): boolean {
    const info = this.getUserInfoFromToken();
    return info?.role === "support";
  }

  requestPasswordReset(email: string) {
    return this.http.post<any>(`${this.apiUrl}/request-reset`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { token, password });
  }
}
