import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pepinodev.duocapp",
  appName: "DuocApp",
  webDir: "www",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
};

export default config;
