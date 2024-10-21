import { Component, OnInit, OnDestroy } from "@angular/core";
import mapboxgl from "mapbox-gl";

@Component({
  selector: "app-map-common",
  templateUrl: "./map-common.component.html",
  styleUrls: ["./map-common.component.scss"],
  standalone: true,
})
export class MapCommonComponent implements OnInit, OnDestroy {
  private watchId: number | null = null;
  private map: mapboxgl.Map | null = null;
  private geolocateControl: mapboxgl.GeolocateControl | null = null;
  private userLocation: mapboxgl.LngLat | null = null;

  constructor() {}

  ngOnInit(): void {
    mapboxgl.accessToken =
      "pk.eyJ1IjoicGVwaW5vZGV2IiwiYSI6ImNtMGNyeHUyMjA1eGIyanByaHU5aXU4OGEifQ.CfbNZGUoxOobO2MILtDIfA";

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
          console.log("User position:", lngLat);
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
  }

  ngOnDestroy(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }
}
