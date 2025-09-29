import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class LoadingService {
  private counter = 0;
  private subject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.subject.asObservable();
  private pending = false;

  private scheduleEmit() {
    if (this.pending) return;
    this.pending = true;
    // Use microtask to avoid ExpressionChanged during current CD cycle
    Promise.resolve().then(() => {
      this.pending = false;
      this.subject.next(this.counter > 0);
    });
  }

  block(): void {
    this.counter++;
    if (this.counter === 1) this.scheduleEmit();
  }

  unblock(): void {
    if (this.counter > 0) {
      this.counter--;
      if (this.counter === 0) this.scheduleEmit();
    }
  }

  async withBlock<T>(promise: Promise<T>): Promise<T> {
    this.block();
    try {
      return await promise;
    } finally {
      this.unblock();
    }
  }
}
