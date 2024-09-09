import { Component, OnInit } from "@angular/core";
import mapboxgl from "mapbox-gl";

@Component({
  selector: "app-map-common",
  templateUrl: "./map-common.component.html",
  styleUrls: ["./map-common.component.scss"],
  standalone: true,
})
export class MapCommonComponent implements OnInit {
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

    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/standard",
      center: [-70.61489622556584, -33.43296948792158],
      zoom: 16,
      attributionControl: false,
    });

    map.on("style.load", () => {
      map.setConfigProperty("basemap", "lightPreset", lightPreset);
      map.resize();
    });

    map.on("render", function () {
      map.resize();
    });
  }
}
