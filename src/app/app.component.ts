import { Component, NgZone, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { initFlowbite } from "flowbite";
import { SupabaseService } from "./supabase.service";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { ThemeSwitcherService } from "./theme-switcher.service";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "web-app";
  hasSession: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private zone: NgZone,
    private router: Router,
    private themeSwitcherService: ThemeSwitcherService,
  ) {
    this.supabase.authChanges((_, session) => {
      if (session?.user) {
        this.zone.run(() => {
          this.router.navigate(["/home"]);
        });
      }
    });
    this.setupListener();
  }

  async ngOnInit() {
    initFlowbite();
    this.hasSession = await this.supabase.hasSession();
    await this.themeSwitcherService.loadInitialTheme(); // Ensure theme is loaded
  }

  setupListener() {
    App.addListener("appUrlOpen", async (data: URLOpenListenerEvent) => {
      const openUrl = data.url;
      const access = openUrl.split("#access_token=").pop()?.split("&")[0] ?? "";
      const refresh =
        openUrl.split("&refresh_token=").pop()?.split("&")[0] ?? "";

      if (access && refresh) {
        await this.supabase.setSession(access, refresh);
        this.zone.run(() => {
          this.router.navigate(["/home"]);
        });
      } else {
        console.error("Access token or refresh token is missing in the URL");
      }
    });
  }
}
