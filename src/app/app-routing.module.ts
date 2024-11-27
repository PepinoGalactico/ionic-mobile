import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { FooterComponent } from "./footer/footer.component";
import { AuthGuard } from "./auth.guard";

const routes: Routes = [
  {
    path: "login",
    loadChildren: () =>
      import("./login/login.module").then((m) => m.LoginPageModule),
    data: {
      preload: true,
    },
  },
  {
    path: "",
    component: FooterComponent,
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "home",
      },
      {
        path: "home",
        loadChildren: () =>
          import("./home/home.module").then((m) => m.HomePageModule),
        data: {
          preload: true,
        },
        canActivate: [AuthGuard],
      },
      {
        path: "account",
        loadChildren: () =>
          import("./account/account.module").then((m) => m.AccountPageModule),
        data: {
          preload: true,
        },
        canActivate: [AuthGuard],
      },
      {
        path: "settings",
        loadChildren: () =>
          import("./settings/settings.module").then(
            (m) => m.SettingsPageModule,
          ),
        data: {
          preload: true,
        },
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.module').then( m => m.WelcomePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
