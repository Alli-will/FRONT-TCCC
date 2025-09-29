import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { DiaryService } from "../services/diary.service";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class DiarioResolver implements Resolve<any> {
  constructor(private diaryService: DiaryService) {}

  resolve() {
    const token = localStorage.getItem("token");
    if (!token) return of({ ess: 0, grafico: { labels: [], datasets: [] } });
    return forkJoin({
      ess: this.diaryService.getUserEss(token).pipe(catchError(() => of({ ess: 0 }))),
      grafico: this.diaryService
        .getDiaryGraphData(token, "semana")
        .pipe(catchError(() => of({ labels: [], datasets: [] }))),
    });
  }
}
