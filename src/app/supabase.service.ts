import { Injectable } from '@angular/core'
import {isPlatform, LoadingController, ToastController} from '@ionic/angular'
import { AuthChangeEvent, createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { environment } from '../environments/environment'

export interface Profile {
  username: string
  avatar_url: string
  names: string
  last_name: string
  second_last_name: string
  address: string
  address_number: string
  comuna: string
  region: string
  apartment: string
  full_name: string
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  supabase: SupabaseClient

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  get user() {
    return this.supabase.auth.getUser().then(({ data }) => data?.user)
  }

  get session() {
    return this.supabase.auth.getSession().then(({ data }) => data?.session)
  }

  get profile() {
    return this.user
      .then((user) => user?.id)
      .then((id) =>
        this.supabase.from('profiles').select(`username, avatar_url, names, last_name, second_last_name, address, address_number, comuna, region, apartment, full_name`).eq('id', id).single()
      )
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  signIn(email: string) {
    const redirectTo = isPlatform("capacitor")
      ? "duocapp://home"
      : `${window.location.origin}/home`;

    return this.supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
  }

  signInGoogle() {
    const redirectTo = isPlatform("capacitor")
      ? "duocapp://home"
      : `${window.location.origin}/home`;

    return this.supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo } })
  }

  async setSession(access_token: string, refresh_token: string) {
    return this.supabase.auth.setSession({ access_token, refresh_token });
  }

  signOut() {
    return this.supabase.auth.signOut()
  }

  async updateProfile(profile: Profile) {
    const user = await this.user
    const update = {
      username: profile.username,
      names: profile.names,
      last_name: profile.last_name,
      second_last_name: profile.second_last_name,
      id: user?.id,
      updated_at: new Date(),
    }

    return this.supabase.from('profiles').upsert(update)
  }

  async updateAddress(profile: Profile) {
    const user = await this.user
    const update = {
      address: profile.address,
      address_number: profile.address_number,
      comuna: profile.comuna,
      region: profile.region,
      apartment: profile.apartment,
      id: user?.id,
      updated_at: new Date(),
    }

    return this.supabase.from('profiles').upsert(update)
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path)
  }

  async uploadAvatar(filePath: string, file: File) {
    const user = await this.user
    const res = await this.supabase.storage.from('avatars').upload(filePath, file)
    const res2 = await this.supabase.from('profiles').upsert({id: user?.id, avatar_url: filePath, updated_at: new Date()})
    return res
  }

  async createNotice(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 5000 })
    await toast.present()
  }

  createLoader() {
    return this.loadingCtrl.create()
  }

  async hasSession(): Promise<boolean> {
    const session = await this.session;
    return !!session;
  }
}
