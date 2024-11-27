import { TestBed } from "@angular/core/testing";
import { ThemeSwitcherService, AppTheme } from "./theme-switcher.service";
import { Storage } from "@ionic/storage-angular";

const mockStorage = {
  create: jasmine.createSpy("create").and.returnValue(Promise.resolve()),
  get: jasmine.createSpy("get").and.returnValue(Promise.resolve(null)),
  set: jasmine.createSpy("set").and.returnValue(Promise.resolve()),
  remove: jasmine.createSpy("remove").and.returnValue(Promise.resolve()),
} as Partial<Storage>;

describe("ThemeSwitcherService", () => {
  let service: ThemeSwitcherService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ThemeSwitcherService,
        { provide: Storage, useValue: mockStorage },
      ],
    });

    service = TestBed.inject(ThemeSwitcherService);

    await service.loadInitialTheme();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
