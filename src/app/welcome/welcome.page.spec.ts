import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { WelcomePage } from "./welcome.page";
import { SupabaseService } from "../supabase.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { of, BehaviorSubject } from "rxjs";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

function createMockPostgrestResponse(
  data: any = null,
  error: any = null,
  count: number | null = null,
  status: number = 200,
  statusText: string = "OK",
): PostgrestSingleResponse<any> {
  return {
    data,
    error,
    count,
    status,
    statusText,
  };
}

describe("WelcomePage", () => {
  let component: WelcomePage;
  let fixture: ComponentFixture<WelcomePage>;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    supabaseService = jasmine.createSpyObj("SupabaseService", [
      "downLoadImage",
      "createLoader",
      "createProfile",
      "updateDriver",
      "createNotice",
    ]);

    supabaseService.downLoadImage.and.returnValue(
      Promise.resolve({ data: new Blob(), error: null }),
    );

    const loadingMock: Partial<HTMLIonLoadingElement> = {
      present: jasmine.createSpy("present"),
      dismiss: jasmine.createSpy("dismiss"),
    };

    supabaseService.createLoader.and.returnValue(
      Promise.resolve(loadingMock as HTMLIonLoadingElement),
    );

    const successResponse = createMockPostgrestResponse();
    const errorResponse = createMockPostgrestResponse(null, {
      message: "Error occurred",
    });

    supabaseService.createProfile.and.returnValue(
      Promise.resolve(successResponse),
    );
    supabaseService.updateDriver.and.returnValue(
      Promise.resolve(successResponse),
    );

    router = jasmine.createSpyObj("Router", ["navigate"]);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [WelcomePage],
      providers: [
        { provide: SupabaseService, useValue: supabaseService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
