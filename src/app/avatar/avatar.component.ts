import { Component, EventEmitter, Input, Output } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { SupabaseService } from '../supabase.service'
import { Camera, CameraResultType } from '@capacitor/camera'
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  imports: [
    NgIf
  ],
  standalone: true
})
export class AvatarComponent {
  _avatarUrl: SafeResourceUrl | undefined

  @Input()
  set avatarUrl(url: string | undefined) {
    if (url) {
      this.downloadImage(url)
    }
  }

  @Output() upload = new EventEmitter<string>()

  constructor(
    private readonly supabase: SupabaseService,
    private readonly dom: DomSanitizer
  ) {}

  async downloadImage(path: string) {
    let data;
    const maxRetries = 3;
    let attempt = 0;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < maxRetries) {
      try {
        const response = await this.supabase.downLoadImage(path);
        data = response.data;
        if (response.error || !data) {
          throw response.error || new Error('No data received');
        }
        this._avatarUrl = this.dom.bypassSecurityTrustResourceUrl(URL.createObjectURL(data!));
        return; // Exit the function if successful
      } catch (error: any) {
        console.error('Error downloading image: ', error.message);
        if (error.status === 429) {
          attempt++;
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          await delay(backoffTime);
        } else {
          break; // Exit the loop for non-429 errors
        }
      }
    }
    // Fallback if all retries fail
    const user = await this.supabase.user;
    const id = user?.id;
    if (id) {
      const profileResponse = await this.supabase.supabase.from('profiles').select('avatar_url').eq('id', id).single();
      this._avatarUrl = profileResponse.data?.avatar_url;
    } else {
      this._avatarUrl = undefined;
    }
  }

  async uploadAvatar() {
    const loader = await this.supabase.createLoader()
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
      })

      const file = await fetch(photo.dataUrl!)
        .then((res) => res.blob())
        .then((blob) => new File([blob], 'my-file', { type: `image/${photo.format}` }))

      const fileName = `${Math.random()}-${new Date().getTime()}.${photo.format}`

      await loader.present()
      const { error } = await this.supabase.uploadAvatar(fileName, file)

      if (error) {
        throw error
      }

      this.upload.emit(fileName)
      this.downloadImage(fileName)
    } catch (error: any) {
      await this.supabase.createNotice(error.message)
    } finally {
      await loader.dismiss()
    }
  }
}
