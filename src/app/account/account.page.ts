import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Profile, SupabaseService } from '../supabase.service'
import { initFlowbite } from 'flowbite';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})

export class AccountPage implements OnInit {
  ngAfterViewInit() {
    initFlowbite();
  }

  profile: Profile = {
    username: '',
    avatar_url: '',
    names: '',
    last_name: '',
    second_last_name: '',
    address: '',
    address_number: '',
    comuna: '',
    region: '',
    apartment: '',
    full_name: ''
  }

  currentAvatarUrl: string | undefined
  email = ''
  fullname = ''
  fulladdress = ''

  regions: { region: string; comunas: string[] }[] = [];
  comunas: string[] = [];

  onAvatarUpload(newUrl: string) {
    this.currentAvatarUrl = newUrl
  }

  constructor(
    private readonly supabase: SupabaseService,
    private http: HttpClient,
  ) {}
  ngOnInit() {
    this.getEmail()
    this.getProfile()
    this.loadRegions();
  }

  async getEmail() {
    this.email = await this.supabase.user.then((user) => user?.email || '')
  }

  async getProfile() {
    try {
      const { data: profile, error, status } = await this.supabase.profile
      if (error && status !== 406) {
        throw error
      }
      if (profile) {
        this.profile = profile
        this.initializeComunas();
      }
    } catch (error: any) {
      alert(error.message)
    }
    if (this.profile.names && this.profile.last_name && this.profile.second_last_name) {
      this.fullname = this.profile.names + ' ' + this.profile.last_name + ' ' + this.profile.second_last_name
    }
    if (this.profile.address && this.profile.address_number && this.profile.apartment && this.profile.comuna) {
      this.fulladdress = this.profile.address + ', ' + this.profile.address_number + ', ' + this.profile.apartment + ', ' + this.profile.comuna
    }
    else if (this.profile.address && this.profile.address_number && this.profile.comuna) {
      this.fulladdress = this.profile.address + ', ' + this.profile.address_number + ', ' + this.profile.comuna
    }
  }

  async updateProfile(avatar_url: string = '') {
    const loader = await this.supabase.createLoader()
    await loader.present()
    try {
      const { error } = await this.supabase.updateProfile({ ...this.profile, avatar_url })
      if (error) {
        throw error
      }
      await loader.dismiss()
      await this.supabase.createNotice('¡Perfil actualizado!')
      await this.getProfile()
    } catch (error: any) {
      await loader.dismiss()
      await this.supabase.createNotice(error.message)
    }
  }

  async updateAddress(avatar_url: string = '') {
    const loader = await this.supabase.createLoader()
    await loader.present()
    try {
      const { error } = await this.supabase.updateAddress({ ...this.profile, avatar_url })
      if (error) {
        throw error
      }
      await loader.dismiss()
      await this.supabase.createNotice('¡Perfil actualizado!')
      await this.getProfile()
    } catch (error: any) {
      await loader.dismiss()
      await this.supabase.createNotice(error.message)
    }
  }

  handleUpload(event: string) {
    this.onAvatarUpload(event);
    this.updateProfile(event);
  }

  async loadRegions() {
    try {
      const data: any[] = await firstValueFrom(this.http.get<any[]>('/assets/comunas.json'));
      if (Array.isArray(data)) {
        this.regions = data.map(item => ({
          region: item.region,
          comunas: item.comunas
        }));
        this.initializeComunas();
      } else {
        console.log('Invalid data format');
      }
    } catch (error) {
      console.log('Error loading regions');
    }
  }

  initializeComunas() {
    if (this.profile.region) {
      const selectedRegionObj = this.regions.find(region => region.region === this.profile.region);
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
