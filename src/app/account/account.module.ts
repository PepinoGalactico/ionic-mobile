import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AccountPageRoutingModule } from './account-routing.module';
import { AccountPage } from './account.page';
import { FooterComponent } from '../footer/footer.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { provideHttpClient } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccountPageRoutingModule,
    FooterComponent,
    AvatarComponent,
  ],
  providers: [
    provideHttpClient()
  ],
  exports: [
    AccountPage
  ],
  declarations: [AccountPage]
})
export class AccountPageModule {}
