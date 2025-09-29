import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { DashboardService } from "../services/dashboard.service";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class DashboardResolver implements Resolve<any> {
  constructor(private dashboardService: DashboardService) {}

  resolve() {
    return forkJoin({
      metrics: this.dashboardService.getMetrics().pipe(catchError(() => of({}))),
      essGeral: this.dashboardService
        .getEssGeral()
        .pipe(catchError(() => of({ ess: 0, valores: [] }))),
    });
  }
}
