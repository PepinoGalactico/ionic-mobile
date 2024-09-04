import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { FooterComponent } from '../footer/footer.component';
import { HomePageRoutingModule } from './home-routing.module';
import {MapCommonComponent} from "../map-common/map-common.component";


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomePageRoutingModule,
        FooterComponent,
        MapCommonComponent,
    ],
    exports: [
        HomePage
    ],
    declarations: [
        HomePage
    ]
})
export class HomePageModule {}
