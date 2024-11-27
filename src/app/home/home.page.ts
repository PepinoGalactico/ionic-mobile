import { Component, OnInit, OnDestroy } from "@angular/core";
import { SupabaseService } from "../supabase.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-home",
  templateUrl: "./home.page.html",
  styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit, OnDestroy {
  currentUserType: "passenger" | "driver" | null = null;
  private userTypeSubscription!: Subscription;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.userTypeSubscription = this.supabaseService.userType$.subscribe(
      (type) => {
        this.currentUserType = type;
      },
    );
  }

  ngOnDestroy() {
    if (this.userTypeSubscription) {
      this.userTypeSubscription.unsubscribe();
    }
  }
}
