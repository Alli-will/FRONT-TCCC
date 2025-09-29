import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: "root" })
export class BlockSupportDiaryGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}
  canActivate(): boolean {
    const info = this.auth.getUserInfoFromToken();
    if (info?.role === "support") {
      this.router.navigate(["/empresa"]);
      return false;
    }
    return true;
  }
}
