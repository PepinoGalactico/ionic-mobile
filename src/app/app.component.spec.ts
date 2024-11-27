import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { NgZone } from "@angular/core";

import { AppComponent } from "./app.component";
import { SupabaseService } from "./supabase.service";
import { ThemeSwitcherService } from "./theme-switcher.service";

interface AuthResponse {
  data: any;
  error: any;
}

describe("AppComponent", () => {
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockThemeSwitcherService: jasmine.SpyObj<ThemeSwitcherService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNgZone: Partial<NgZone>;

  beforeEach(async () => {
    mockSupabaseService = jasmine.createSpyObj("SupabaseService", [
      "authChanges",
      "hasSession",
      "setSession",
    ]);

    mockSupabaseService.authChanges.and.stub();
    mockSupabaseService.hasSession.and.returnValue(Promise.resolve(false));
    mockSupabaseService.setSession.and.returnValue(
      Promise.resolve({
        data: null,
        error: null,
      } as AuthResponse),
    );

    mockThemeSwitcherService = jasmine.createSpyObj("ThemeSwitcherService", [
      "loadInitialTheme",
    ]);

    mockThemeSwitcherService.loadInitialTheme.and.returnValue(
      Promise.resolve(),
    );

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    mockNgZone = {
      run: (fn: Function) => fn(),
      runOutsideAngular: (fn: Function) => fn(),
      onUnstable: new EventEmitter<void>(),
      onMicrotaskEmpty: new EventEmitter<void>(),
      onStable: new EventEmitter<void>(),
      onError: new EventEmitter<any>(),
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ThemeSwitcherService, useValue: mockThemeSwitcherService },
        { provide: Router, useValue: mockRouter },
        { provide: NgZone, useValue: mockNgZone },
      ],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
