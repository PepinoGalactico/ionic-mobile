import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { SupabaseService } from "./supabase.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
  ) {}

  async canActivate(): Promise<boolean> {
    const session = await this.supabaseService.session;
    const profile = await this.supabaseService.profile;
    if (session) {
      if (profile.data?.is_registered === false) {
        this.router.navigate(["/welcome"]);
        return false;
      } else {
        return true;
      }
    } else {
      this.router.navigate(["/login"]);
      return false;
    }
  }
}
