import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { resolveApiBase } from './api-base';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private primaryBase = resolveApiBase();
  private remoteBase = 'https://tcc-main.up.railway.app';
  private apiUrl = `${this.primaryBase}/dashboard/metrics`;

  constructor(private http: HttpClient) {}

  private withFallback<T>(req: Observable<T>, remote: () => Observable<T>) {
    return req.pipe(catchError(err => {
      if (err.status === 0 || err.status === 404) return remote();
      return throwError(() => err);
    }));
  }

  getMetrics(): Observable<any> {
    return this.withFallback(
      this.http.get<any>(this.apiUrl),
      () => this.http.get<any>(`${this.remoteBase}/dashboard/metrics`)
    );
  }

  getEssGeral() {
    return this.withFallback(
      this.http.get<{ ess: number, valores: number[] }>(`${this.primaryBase}/dashboard/ess-geral`),
      () => this.http.get<{ ess: number, valores: number[] }>(`${this.remoteBase}/dashboard/ess-geral`)
    );
  }

  getEmotionPercentages(): Observable<any> {
    return this.withFallback(
      this.http.get<any>(`${this.primaryBase}/diary/emotion-percentages`),
      () => this.http.get<any>(`${this.remoteBase}/diary/emotion-percentages`)
    );
  }
}
