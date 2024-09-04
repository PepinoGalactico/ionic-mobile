import { Component, OnInit } from '@angular/core'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  errorMessage: string = '';

  constructor(private readonly supabase: SupabaseService) {
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async handleLogin(event: any) {
    event.preventDefault()
    if (this.validateEmail(this.email)) {
      this.errorMessage = '';
      const loader = await this.supabase.createLoader()
      await loader.present()
      try {
        const {error} = await this.supabase.signIn(this.email)
        if (error) {
          throw error
        }
        await loader.dismiss()
        await this.supabase.createNotice('Check your email for the login link!')
      } catch (error: any) {
        await loader.dismiss()
        await this.supabase.createNotice(error.error_description || error.message)
      }
    } else {
      this.errorMessage = 'Please enter a valid email address.';
    }
  }

  async handleOAuth(event: any) {
    event.preventDefault()
    const loader = await this.supabase.createLoader()
    await loader.present()
    try {
      const {error} = await this.supabase.signInGoogle()
      if (error) {
        throw error
      }
      await loader.dismiss()
    } catch (error: any) {
      await loader.dismiss()
      await this.supabase.createNotice(error.error_description || error.message)
    }
  }
}

