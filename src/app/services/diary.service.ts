import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { resolveApiBase } from './api-base';

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private primaryBase = resolveApiBase();
  private remoteBase = 'https://tcc-main.up.railway.app';
  private apiUrl = `${this.primaryBase}/diary`;
  private apiAllUrl = `${this.primaryBase}/diary/all`;

  constructor(private http: HttpClient) {}

  private withFallback<T>(req: Observable<T>, remote: () => Observable<T>) {
    return req.pipe(catchError(err => {
      if (err.status === 0 || err.status === 404) return remote();
      return throwError(() => err);
    }));
  }

  createDiaryEntry(entry: any, token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.withFallback(
      this.http.post(`${this.apiUrl}/create`, entry, { headers }),
      () => this.http.post(`${this.remoteBase}/diary/create`, entry, { headers })
    );
  }

  getDiaryEntries(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.withFallback(
      this.http.get(this.apiUrl, { headers }),
      () => this.http.get(`${this.remoteBase}/diary`, { headers })
    );
  }

  getAllDiaryEntries(): Observable<any> {
    return this.withFallback(
      this.http.get(this.apiAllUrl),
      () => this.http.get(`${this.remoteBase}/diary/all`)
    );
  }

  hasEntryToday(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.withFallback(
      this.http.get(`${this.primaryBase}/diary/has-entry-today`, { headers }),
      () => this.http.get(`${this.remoteBase}/diary/has-entry-today`, { headers })
    );
  }

  getDiaryInsights(token: string) {
    const headers = this.getAuthHeaders(token);
    return this.withFallback(
      this.http.get(`${this.apiUrl}/insights`, { headers }),
      () => this.http.get(`${this.remoteBase}/diary/insights`, { headers })
    );
  }

  getDiaryGraphData(token: string, period: string) {
    const headers = this.getAuthHeaders(token);
    return this.withFallback(
      this.http.get(`${this.apiUrl}/graph-data?period=${period}`, { headers }),
      () => this.http.get(`${this.remoteBase}/diary/graph-data?period=${period}`, { headers })
    );
  }

  getUserEss(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.withFallback(
      this.http.get(`${this.primaryBase}/dashboard/ess`, { headers }),
      () => this.http.get(`${this.remoteBase}/dashboard/ess`, { headers })
    );
  }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
