import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'https://tcc-main.up.railway.app/dashboard/metrics';

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getEssGeral() {
    return this.http.get<{ ess: number, valores: number[] }>('https://tcc-main.up.railway.app/dashboard/ess-geral');
  }

  getEmotionPercentages(): Observable<any> {
    return this.http.get<any>('https://tcc-main.up.railway.app/diary/emotion-percentages');
  }
}
