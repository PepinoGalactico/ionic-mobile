import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { environment } from "../../environments/environment";
import { Subscription, BehaviorSubject } from "rxjs";
import {
  Profile,
  Vehicle,
  RideRequest,
  SupabaseService,
} from "../supabase.service";
import { AlertController, ToastController } from "@ionic/angular";

@Component({
  selector: "app-map-common",
  templateUrl: "./map-common.component.html",
  styleUrls: ["./map-common.component.scss"],
  standalone: true,
})
export class MapCommonComponent implements OnInit, OnDestroy {
  @Input() userType: "passenger" | "driver" = "passenger";

  private watchId: number | null = null;
  private map: mapboxgl.Map | null = null;
  private geolocateControl: mapboxgl.GeolocateControl | null = null;
  private userLocation: mapboxgl.LngLat | null = null;
  private destinationMarker: mapboxgl.Marker | null = null;
  private geocoder: MapboxGeocoder | null = null;
  private rideRequestSubscription?: Subscription;
  private driverLocation$ = new BehaviorSubject<mapboxgl.LngLat | null>(null);
  private deniedRequestsThisSession = new Set<string>();
  private rideRequestMarkers = new Map<string, mapboxgl.Marker>();

  constructor(
    private supabaseService: SupabaseService,
    private alertController: AlertController,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    mapboxgl.accessToken = environment.mapboxKey;

    const currentHour = new Date().getHours();
    let lightPreset = "day";

    if (currentHour >= 6 && currentHour < 8) {
      lightPreset = "dawn";
    } else if (currentHour >= 9 && currentHour < 18) {
      lightPreset = "day";
    } else if (currentHour >= 18 && currentHour < 20) {
      lightPreset = "dusk";
    } else {
      lightPreset = "night";
    }

    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/standard",
      center: [-70.61489622556584, -33.43296948792158],
      zoom: 16,
      attributionControl: false,
    });

    this.geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: false,
      showUserHeading: true,
    });

    this.map.addControl(this.geolocateControl, "bottom-right");

    this.map.on("style.load", () => {
      this.map!.setConfigProperty("basemap", "lightPreset", lightPreset);
      this.map!.resize();
    });

    this.map.on("render", () => {
      this.map!.resize();
    });

    this.map.on("pluginStateChange", () => {
      this.map!.resize();
    });

    this.map.on("load", () => {
      this.geolocateControl!.trigger();
    });

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lngLat = new mapboxgl.LngLat(
            position.coords.longitude,
            position.coords.latitude,
          );
          this.userLocation = lngLat;
          this.driverLocation$.next(lngLat); // Emit location
          console.log("User/Driver position:", lngLat);
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 27000,
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    this.geolocateControl.on("geolocate", () => {
      if (this.userLocation) {
        this.map?.flyTo({
          center: [this.userLocation.lng, this.userLocation.lat],
          zoom: 16,
          speed: 1.5,
          curve: 1,
          easing(t) {
            return t;
          },
        });
      }
    });

    if (this.userType === "passenger") {
      this.initializePassengerView();
    } else {
      this.initializeDriverView();
    }
  }

  private initializePassengerView() {
    const geocoderOptions = {
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      placeholder: "Ingresa tu destino",
    };

    this.geocoder = new MapboxGeocoder(geocoderOptions);
    this.map?.addControl(this.geocoder, "top-left");

    this.geocoder.on("result", (event: any) => {
      const coordinates = event.result.geometry.coordinates;

      if (this.destinationMarker) {
        this.destinationMarker.remove();
      }

      this.destinationMarker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .addTo(this.map!);

      this.createRideRequest(coordinates);
    });
  }

  private async createRideRequest(destinationCoordinates: [number, number]) {
    if (!this.userLocation) {
      console.error("User location not available");
      const toast = await this.toastController.create({
        message: "No se pudo obtener tu ubicación actual, intenta nuevamente.",
        duration: 3000,
        color: "danger",
      });
      await toast.present();
      return;
    }

    const rideRequest: RideRequest = {
      passenger_id: await this.supabaseService.getCurrentUserId(),
      pickup_location: {
        lng: this.userLocation.lng,
        lat: this.userLocation.lat,
      },
      destination_location: {
        lng: destinationCoordinates[0],
        lat: destinationCoordinates[1],
      },
      status: "pending",
    };

    const loading = await this.supabaseService.createLoader();
    await loading.present();

    try {
      await this.supabaseService.createRideRequest(rideRequest);
      console.log("Solicitud de viaje creada exitosamente");

      await loading.dismiss();
      const toast = await this.toastController.create({
        message: "Ride request created successfully!",
        duration: 3000,
        color: "success",
      });
      await toast.present();
    } catch (error) {
      console.error("Error creating ride request:", error);
      await loading.dismiss();
      const toast = await this.toastController.create({
        message:
          "Error al crear la solicitud de viaje. Por favor, inténtelo de nuevo.",
        duration: 3000,
        color: "danger",
      });
      await toast.present();
    }
  }

  private initializeDriverView() {
    this.rideRequestSubscription = this.supabaseService
      .getAvailableRideRequestsRealtime()
      .subscribe({
        next: (rideRequests: RideRequest[]) => {
          this.displayRideRequests(rideRequests);
        },
        error: (error) => {
          console.error(
            "Error fetching available ride requests (realtime):",
            error,
          );
        },
      });
  }

  private displayRideRequests(rideRequests: RideRequest[]) {
    rideRequests
      .filter((request) => request.status === "pending")
      .forEach((request) => {
        if (this.rideRequestMarkers.has(request.id)) {
          return;
        }

        const el = document.createElement("div");
        el.className = "marker";
        el.innerHTML = `
          <div class="marker-popup">
            <h3>Ride Request</h3>
            <button class="accept-ride-btn" data-request-id="${request.id}">Aceptar Viaje</button>
            <button class="deny-ride-btn" data-request-id="${request.id}">Rechazar Viaje</button>
          </div>
        `;

        el.querySelector(".accept-ride-btn")?.addEventListener("click", (e) => {
          const requestId = (e.target as HTMLElement).getAttribute(
            "data-request-id",
          );
          if (requestId) {
            this.acceptRide(requestId);
          }
        });

        el.querySelector(".deny-ride-btn")?.addEventListener("click", (e) => {
          const requestId = (e.target as HTMLElement).getAttribute(
            "data-request-id",
          );
          if (requestId) {
            this.denyRide(requestId);
          }
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([request.pickup_location.lng, request.pickup_location.lat])
          .addTo(this.map!);

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <h3>Pickup Location</h3>
          <p>Distance: ${this.calculateDistance(
            this.userLocation!,
            request.pickup_location,
          ).toFixed(2)} km</p>
        `);

        marker.setPopup(popup);
        this.rideRequestMarkers.set(request.id, marker);

        marker.getElement().addEventListener("mouseenter", () => {
          marker.togglePopup();
        });
      });
  }

  private calculateDistance(
    point1: mapboxgl.LngLat | { lng: number; lat: number },
    point2: { lng: number; lat: number },
  ): number {
    const R = 6371;
    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private isWithinProximity(
    userLocation: mapboxgl.LngLat,
    pickupLocation: { lng: number; lat: number },
    thresholdKm: number = 5,
  ): boolean {
    const distance = this.calculateDistance(userLocation, pickupLocation);
    return distance <= thresholdKm;
  }

  private async showRideRequestAlert(request: RideRequest) {
    const alert = await this.alertController.create({
      header: "New Ride Request",
      message: `Pickup Location: (${request.pickup_location.lat.toFixed(4)}, ${request.pickup_location.lng.toFixed(4)})`,
      buttons: [
        {
          text: "Aceptar",
          handler: () => {
            this.acceptRide(request.id);
          },
        },
        {
          text: "Rechazar",
          handler: () => {
            this.denyRide(request.id);
          },
        },
      ],
      backdropDismiss: false,
    });

    await alert.present();
  }

  private async denyRide(requestId: string) {
    if (this.deniedRequestsThisSession.has(requestId)) {
      console.warn("Ride request already denied in this session.");
      return;
    }

    try {
      await this.supabaseService.denyRideRequest(requestId);
      console.log("Ride denied successfully");

      this.removeRideRequestMarker(requestId);
      this.deniedRequestsThisSession.add(requestId);
    } catch (error) {
      console.error("Error denying ride:", error);
    }
  }

  async acceptRide(requestId: string) {
    try {
      await this.supabaseService.updateRideRequest(requestId, {
        driver_id: await this.supabaseService.getCurrentUserId(),
        status: "accepted",
      });
      console.log("Ride accepted successfully");

      this.removeRideRequestMarker(requestId);
    } catch (error) {
      console.error("Error accepting ride:", error);
    }
  }

  private removeRideRequestMarker(requestId: string) {
    const marker = this.rideRequestMarkers.get(requestId);
    if (marker) {
      marker.remove();
      this.rideRequestMarkers.delete(requestId);
    }
  }

  ngOnDestroy(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    if (this.rideRequestSubscription) {
      this.rideRequestSubscription.unsubscribe();
    }

    if (this.map) {
      this.map.remove();
    }
  }
}
