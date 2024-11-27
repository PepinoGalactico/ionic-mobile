import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";
import { SettingsPage } from "./settings.page";
import { ThemeSwitcherService } from "../theme-switcher.service";
import { Storage } from "@ionic/storage-angular";
import { of } from "rxjs";

describe("SettingsPage", () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;
  let mockThemeSwitcherService: jasmine.SpyObj<ThemeSwitcherService>;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(waitForAsync(() => {
    mockStorage = jasmine.createSpyObj("Storage", ["get", "set", "remove"]);
    mockStorage.get.and.returnValue(Promise.resolve(null));
    mockStorage.set.and.returnValue(Promise.resolve());
    mockStorage.remove.and.returnValue(Promise.resolve());

    mockThemeSwitcherService = jasmine.createSpyObj(
      "ThemeSwitcherService",
      ["loadInitialTheme"],
      {
        currentTheme: of("light"),
      },
    );

    mockThemeSwitcherService.loadInitialTheme.and.returnValue(
      Promise.resolve(),
    );

    TestBed.configureTestingModule({
      declarations: [SettingsPage],
      imports: [IonicModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ThemeSwitcherService, useValue: mockThemeSwitcherService },
        { provide: Storage, useValue: mockStorage },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
