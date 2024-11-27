import { Component, OnInit, ViewChild } from "@angular/core";
import { IonModal } from "@ionic/angular";
import { Router } from "@angular/router";
import { Profile, Vehicle, SupabaseService } from "../supabase.service";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-welcome",
  templateUrl: "./welcome.page.html",
  styleUrls: ["./welcome.page.scss"],
})
export class WelcomePage implements OnInit {
  @ViewChild("modal1") modal1!: IonModal;
  @ViewChild("modal2") modal2!: IonModal;

  regions: { region: string; comunas: string[] }[] = [];
  comunas: string[] = [];

  validationErrors = {
    name: "",
    last_name: "",
    second_last_name: "",
    address: "",
    address_number: "",
    apartment: "",
    region: "",
    comuna: "",
    license_plate: "",
    brand: "",
    model: "",
    color: "",
    year: "",
  };

  private readonly namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]+$/;
  private readonly alphanumericPattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s'\-]+$/;
  private readonly licensePlatePattern = /^([A-Z]{2}\d{4}|[A-Z]{4}\d{2})$/;

  constructor(
    private readonly supabase: SupabaseService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadRegions();
  }

  profile: Profile = {
    avatar_url: "",
    name: "",
    last_name: "",
    second_last_name: "",
    address: "",
    address_number: "",
    comuna: "",
    region: "",
    apartment: "",
    full_name: "",
    is_registered: false,
  };

  vehicle: Vehicle = {
    license_plate: "",
    brand: "",
    model: "",
    year: null,
    color: "",
  };

  currentAvatarUrl: string | undefined;
  loading = false;

  async updateProfile(avatar_url: string = "") {
    if (!this.validateAllFields()) {
      await this.supabase.createNotice(
        "Por favor, completa todos los campos correctamente.",
      );
      console.log(this.validationErrors);
      return;
    }

    const loader = await this.supabase.createLoader();
    await loader.present();
    try {
      const { error } = await this.supabase.createProfile({
        ...this.profile,
        is_registered: true,
      });
      if (error) {
        throw error;
      }
      await loader.dismiss();
      this.modal1.dismiss();
      this.router.navigate(["/home"]);
    } catch (error: any) {
      await loader.dismiss();
      await this.supabase.createNotice(error.message);
    }
  }

  async updateDriver() {
    if (!this.validateAllFieldsDriver() && !this.validateAllFields()) {
      await this.supabase.createNotice(
        "Por favor, completa todos los campos correctamente.",
      );
      console.log(this.validationErrors);
      return;
    }

    const loader = await this.supabase.createLoader();
    await loader.present();
    try {
      const { error } = await this.supabase.createProfile({
        ...this.profile,
        is_registered: true,
      });
      const { error: error2 } = await this.supabase.updateDriver({
        ...this.vehicle,
      });
      if (error) {
        throw error;
      }
      if (error2) {
        throw error2;
      }
      await loader.dismiss();
      this.modal2.dismiss();
      this.router.navigate(["/home"]);
    } catch (error: any) {
      await loader.dismiss();
      await this.supabase.createNotice(error.message);
    }
  }

  validateAllFields(): boolean {
    this.resetValidationErrors();

    let isValid = true;

    if (!this.profile.name) {
      this.validationErrors.name = "El nombre es requerido";
      isValid = false;
    } else if (!this.namePattern.test(this.profile.name)) {
      this.validationErrors.name = "El nombre solo debe contener letras";
      isValid = false;
    }

    if (!this.profile.last_name) {
      this.validationErrors.last_name = "El apellido paterno es requerido";
      isValid = false;
    } else if (!this.namePattern.test(this.profile.last_name)) {
      this.validationErrors.last_name =
        "El apellido paterno solo debe contener letras";
      isValid = false;
    }

    if (!this.profile.second_last_name) {
      this.validationErrors.second_last_name =
        "El apellido materno es requerido";
      isValid = false;
    } else if (!this.namePattern.test(this.profile.second_last_name)) {
      this.validationErrors.second_last_name =
        "El apellido materno solo debe contener letras";
      isValid = false;
    }

    if (!this.profile.address) {
      this.validationErrors.address = "La dirección es requerida";
      isValid = false;
    } else if (!this.alphanumericPattern.test(this.profile.address)) {
      this.validationErrors.address =
        "La dirección solo debe contener letras y números";
      isValid = false;
    }

    if (!this.profile.address_number) {
      this.validationErrors.address_number = "El número es requerido";
      isValid = false;
    } else if (!this.alphanumericPattern.test(this.profile.address_number)) {
      this.validationErrors.address_number =
        "El número solo debe contener números";
      isValid = false;
    }

    if (
      this.profile.apartment &&
      !this.alphanumericPattern.test(this.profile.apartment)
    ) {
      this.validationErrors.apartment =
        "El departamento solo debe contener letras y números";
      isValid = false;
    }

    if (!this.profile.region) {
      this.validationErrors.region = "La región es requerida";
      isValid = false;
    }

    if (!this.profile.comuna) {
      this.validationErrors.comuna = "La comuna es requerida";
      isValid = false;
    }

    return isValid;
  }

  validateAllFieldsDriver(): boolean {
    this.resetValidationErrors();
    let isValid = this.validateAllFields();

    if (!this.vehicle.license_plate) {
      this.validationErrors.license_plate = "La patente es requerida";
      isValid = false;
    } else if (
      !this.licensePlatePattern.test(this.vehicle.license_plate.toUpperCase())
    ) {
      this.validationErrors.license_plate =
        "La patente debe tener formato AA1234 o AAAA12";
      isValid = false;
    }

    if (!this.vehicle.brand) {
      this.validationErrors.brand = "La marca es requerida";
      isValid = false;
    } else if (!this.alphanumericPattern.test(this.vehicle.brand)) {
      this.validationErrors.brand =
        "La marca debe contener solo letras y números";
      isValid = false;
    }

    if (!this.vehicle.model) {
      this.validationErrors.model = "El modelo es requerido";
      isValid = false;
    } else if (!this.alphanumericPattern.test(this.vehicle.model)) {
      this.validationErrors.model =
        "El modelo debe contener solo letras y números";
      isValid = false;
    }

    if (!this.vehicle.color) {
      this.validationErrors.color = "El color es requerido";
      isValid = false;
    } else if (!this.namePattern.test(this.vehicle.color)) {
      this.validationErrors.color = "El color debe contener solo letras";
      isValid = false;
    }

    if (this.vehicle.year !== null) {
      const currentYear = new Date().getFullYear();
      if (this.vehicle.year < 1900 || this.vehicle.year > currentYear) {
        this.validationErrors.year =
          "El año debe estar entre 1900 y " + currentYear;
        isValid = false;
      }
    }

    return isValid;
  }

  onInputChange(field: keyof Profile, event: Event) {
    const value = (event.target as HTMLInputElement).value;

    switch (field) {
      case "name":
      case "last_name":
      case "second_last_name":
        if (!this.namePattern.test(value)) {
          this.validationErrors[field] = "Solo se permiten letras";
        } else {
          this.validationErrors[field] = "";
        }
        break;
      case "address":
      case "address_number":
      case "apartment":
        if (!this.alphanumericPattern.test(value)) {
          this.validationErrors[field] = "Solo se permiten letras y números";
        } else {
          this.validationErrors[field] = "";
        }
        break;
    }
  }

  resetValidationErrors() {
    Object.keys(this.validationErrors).forEach((key) => {
      this.validationErrors[key as keyof typeof this.validationErrors] = "";
    });
  }

  async loadRegions() {
    try {
      const data: any[] = await firstValueFrom(
        this.http.get<any[]>("/assets/comunas.json"),
      );
      if (Array.isArray(data)) {
        this.regions = data.map((item) => ({
          region: item.region,
          comunas: item.comunas,
        }));
        this.initializeComunas();
      } else {
        console.log("Invalid data format");
      }
    } catch (error) {
      console.log("Error loading regions");
    }
  }

  initializeComunas() {
    if (this.profile.region) {
      const selectedRegionObj = this.regions.find(
        (region) => region.region === this.profile.region,
      );
      this.comunas = selectedRegionObj ? selectedRegionObj.comunas : [];
    }
  }

  onRegionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.profile.region = target.value;
    this.initializeComunas();
  }

  onComunaChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.profile.comuna = target.value;
  }
}
