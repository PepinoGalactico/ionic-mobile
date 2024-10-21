import { Component, OnInit } from "@angular/core";
import { Profile, SupabaseService } from "../supabase.service";
import { Router } from "@angular/router";
import { ThemeSwitcherService } from "../theme-switcher.service";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.page.html",
  styleUrls: ["./settings.page.scss"],
})
export class SettingsPage implements OnInit {
  constructor(
    private readonly supabase: SupabaseService,
    private router: Router,
    protected darkThemeSelectorService: ThemeSwitcherService,
  ) {}

  ngOnInit() {}

  async signOut() {
    try {
      await this.supabase.signOut();
      await this.router.navigate(["/login"], { replaceUrl: true });
      window.location.reload();
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }
}
