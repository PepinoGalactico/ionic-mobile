import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";
import { AvatarComponent } from "./avatar.component";
import { SupabaseService } from "../supabase.service";
import { DomSanitizer } from "@angular/platform-browser";
import { of } from "rxjs";

describe("AvatarComponent", () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let domSanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(waitForAsync(() => {
    supabaseService = jasmine.createSpyObj("SupabaseService", [
      "downLoadImage",
      "createLoader",
      "uploadAvatar",
      "createNotice",
    ]);
    supabaseService.downLoadImage.and.returnValue(
      Promise.resolve({ data: new Blob(), error: null }),
    );

    domSanitizer = jasmine.createSpyObj("DomSanitizer", [
      "bypassSecurityTrustResourceUrl",
    ]);
    domSanitizer.bypassSecurityTrustResourceUrl.and.callFake(
      (url: string) => url,
    );

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AvatarComponent],
      providers: [
        { provide: SupabaseService, useValue: supabaseService },
        { provide: DomSanitizer, useValue: domSanitizer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
