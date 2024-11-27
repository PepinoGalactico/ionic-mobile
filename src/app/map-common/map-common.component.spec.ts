import { ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";
import { MapCommonComponent } from "./map-common.component";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

describe("MapCommonComponent", () => {
  let component: MapCommonComponent;
  let fixture: ComponentFixture<MapCommonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MapCommonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MapCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
