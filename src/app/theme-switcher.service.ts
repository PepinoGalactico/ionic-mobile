import { Injectable, signal } from "@angular/core";
import { Storage } from "@ionic/storage-angular";

export enum AppTheme {
  LIGHT = "light",
  DARK = "dark",
}

const LS_THEME = "theme";

@Injectable({
  providedIn: "root",
})
export class ThemeSwitcherService {
  private storageReady: Promise<void>;

  currentTheme = signal<AppTheme | undefined>(undefined);

  constructor(private storage: Storage) {
    this.storageReady = this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
  }

  public async loadInitialTheme() {
    await this.storageReady;
    const storedTheme = (await this.storage.get(LS_THEME)) as AppTheme;
    if (storedTheme) {
      this.currentTheme.set(storedTheme);
      this.applyTheme(storedTheme);
    } else {
      this.setSystemTheme();
    }
  }

  async setLightTheme() {
    this.currentTheme.set(AppTheme.LIGHT);
    await this.setToLocalStorage(AppTheme.LIGHT);
    this.applyTheme(AppTheme.LIGHT);
  }

  async setDarkTheme() {
    this.currentTheme.set(AppTheme.DARK);
    await this.setToLocalStorage(AppTheme.DARK);
    this.applyTheme(AppTheme.DARK);
  }

  async setSystemTheme() {
    this.currentTheme.set(undefined);
    await this.removeFromLocalStorage();
    if (isSystemDark()) {
      this.applyTheme(AppTheme.DARK);
    } else {
      this.applyTheme(AppTheme.LIGHT);
    }
  }

  private applyTheme(theme: AppTheme) {
    if (theme === AppTheme.DARK) {
      this.addClassToHtml("dark");
    } else {
      this.removeClassFromHtml("dark");
    }
  }

  private addClassToHtml(className: string) {
    document.documentElement.classList.add(className);
  }

  private removeClassFromHtml(className: string) {
    document.documentElement.classList.remove(className);
  }

  private async setToLocalStorage(theme: AppTheme) {
    await this.storageReady;
    await this.storage.set(LS_THEME, theme);
  }

  private async removeFromLocalStorage() {
    await this.storageReady;
    await this.storage.remove(LS_THEME);
  }
}

function isSystemDark() {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    return false;
  }
}
