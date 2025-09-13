import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, switchMap, throwError } from "rxjs";
import { resolveApiBase } from './api-base';

@Injectable({
  providedIn: "root",
})
export class UserService {
  private base = resolveApiBase();
  private apiUrl = `${this.base}/user/register-access`;
  private apiAllUsersUrl = `${this.base}/user`;
  private localCreateCollaboratorUrl = `${this.base}/user/create-collaborator`;
  private localDepartmentsUrl = `${this.base}/departments`;
  private localUserByEmailUrl = `${this.base}/user/by-email`;
  private localMeUrl = `${this.base}/user/me`;
  private remoteMeUrl = this.localMeUrl; // mesma base
  private remoteUserByEmailUrl = this.localUserByEmailUrl;
  private userUrl = `${this.base}/user`;

  constructor(private http: HttpClient) {}

  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  createCollaboratorLocal(data: { first_Name: string; last_Name: string; email: string; password: string; departmentId?: number }): Observable<any> {
    return this.http.post(this.localCreateCollaboratorUrl, data);
  }

  getDepartmentsLocal(): Observable<any[]> {
    return this.http.get<any[]>(this.localDepartmentsUrl);
  }

  updateUser(user: any): Observable<any> {
    return this.http.put(this.apiUrl, user);
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.localUserByEmailUrl}?email=${encodeURIComponent(email)}`);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(this.localMeUrl).pipe(
      catchError(err => {
        if (err.status === 404 || err.status === 0) {
          // fallback para remoto
          return this.http.get<any>(this.remoteMeUrl).pipe(
            catchError(e2 => {
              // fallback final: tentar by-email se token disponível
              const payloadRaw = localStorage.getItem('token');
              if (!payloadRaw) return throwError(() => e2);
              try {
                const token = payloadRaw;
                const payload = JSON.parse(atob(token.split('.')[1] || ''));
                const email = payload?.email;
                if (email) {
                  return this.http.get<any>(`${this.remoteUserByEmailUrl}?email=${encodeURIComponent(email)}`);
                }
              } catch {}
              return throwError(() => e2);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  updateCurrentUser(data: any): Observable<any> {
    return this.http.put<any>(this.localMeUrl, data).pipe(
      catchError(err => {
        if (err.status === 404 || err.status === 0) {
          return this.http.put<any>(this.remoteMeUrl, data);
        }
        return throwError(() => err);
      })
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiAllUsersUrl);
  }

  getUsersByStatus(status: 'ativos' | 'inativos' | 'todos'): Observable<any[]> {
    const s = status || 'ativos';
    return this.http.get<any[]>(`${this.apiAllUsersUrl}?status=${encodeURIComponent(s)}`);
  }

  setActive(id: number, ativo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.userUrl}/${id}/active`, { ativo });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.userUrl}/${id}`);
  }
}
