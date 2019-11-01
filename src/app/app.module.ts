import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogConfig, MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgAggregatePipesModule, NgArrayPipesModule } from 'angular-pipes';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgxCurrencyModule } from 'ngx-currency';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AlertComponent } from './modals/alert/alert.component';
import { AreaComponent } from './pages/area/area.component';
import { BillComponent } from './pages/area/bill/bill.component';
import { DiscountComponent } from './pages/area/bill/discount/discount.component';
import { CursorEndDirective } from './pages/area/bill/pay/cursor-end.directive';
import { PayComponent } from './pages/area/bill/pay/pay.component';
import { NewBillComponent } from './pages/area/new-bill/new-bill.component';
import { OrderComponent } from './pages/area/bill/order/order.component';
import { ProductComponent } from './pages/area/bill/order/product/product.component';
import { AreasComponent } from './pages/areas/areas.component';
import { CloseAreaComponent } from './pages/areas/close-area/close-area.component';
import { OpenAreaComponent } from './pages/areas/open-area/open-area.component';
import { LoginComponent } from './pages/login/login.component';
import { HasPipe } from './pipes/has.pipe';
import { SearchPipe } from './pipes/search.pipe';
import { ChangeTableComponent } from './pages/area/bill/change-table/change-table.component';
import {BlockUIModule} from 'primeng/blockui';

@NgModule({
  declarations: [
    AppComponent,
    AreasComponent,
    AreaComponent,

    LoginComponent,

    AlertComponent,

    OpenAreaComponent,
    CloseAreaComponent,

    BillComponent,
    NewBillComponent,
    OrderComponent,
    ProductComponent,
    PayComponent,
    DiscountComponent,
    ChangeTableComponent,

    HasPipe,
    SearchPipe,

    CursorEndDirective,
  ],
  entryComponents: [
    LoginComponent,

    AlertComponent,

    OpenAreaComponent,
    CloseAreaComponent,

    BillComponent,
    NewBillComponent,
    OrderComponent,
    ProductComponent,
    PayComponent,
    DiscountComponent,
    ChangeTableComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    AppRoutingModule,

    AngularDraggableModule,
    NgxCurrencyModule.forRoot({
      align: 'right',
      prefix: '$',
      precision: 2,
      allowNegative: false,
      allowZero: true,
      decimal: '.',
      thousands: ',',
      nullable: true,
      suffix: ''
    }),

    BlockUIModule,

    MatDialogModule,

    NgAggregatePipesModule,
    NgArrayPipesModule,
  ],
  providers: [
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ... new MatDialogConfig(), maxHeight: '100%', maxWidth: '100%' }
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
