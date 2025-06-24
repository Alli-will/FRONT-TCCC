import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:3000/dashboard/metrics'; // ajuste se necessário

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
