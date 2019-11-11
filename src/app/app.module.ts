import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogConfig, MatDialogModule, MatSnackBarModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgAggregatePipesModule, NgArrayPipesModule } from 'angular-pipes';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgxCurrencyModule } from 'ngx-currency';
import { BlockUIModule } from 'primeng/blockui';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorInterceptor } from './core/error.interceptor';
import { AlertModalComponent } from './modals/alert/alert.component';
import { LoginModalComponent } from './modals/login/login.component';
import { SelectModalComponent } from './modals/select/select.component';
import { AreaComponent } from './pages/area/area.component';
import { BillModalComponent } from './pages/area/bill/bill.component';
import { ChangeTableModalComponent } from './pages/area/bill/change-table/change-table.component';
import { DiscountModalComponent } from './pages/area/bill/discount/discount.component';
import { OrderModalComponent } from './pages/area/bill/order/order.component';
import { ProductComponent } from './pages/area/bill/order/product/product.component';
import { CursorEndDirective } from './pages/area/bill/pay/cursor-end.directive';
import { PayComponent } from './pages/area/bill/pay/pay.component';
import { NewBillComponent } from './pages/area/new-bill/new-bill.component';
import { AreasComponent } from './pages/areas/areas.component';
import { CloseAreaComponent } from './pages/areas/close-area/close-area.component';
import { OpenAreaComponent } from './pages/areas/open-area/open-area.component';
import { HasNotPipe, HasPipe } from './pipes/has.pipe';
import { SearchPipe } from './pipes/search.pipe';

@NgModule({
  declarations: [
    AppComponent,
    AreasComponent,
    AreaComponent,

    LoginModalComponent,

    AlertModalComponent,
    SelectModalComponent,

    OpenAreaComponent,
    CloseAreaComponent,

    BillModalComponent,
    NewBillComponent,
    OrderModalComponent,
    ProductComponent,
    PayComponent,
    DiscountModalComponent,
    ChangeTableModalComponent,

    HasPipe,
    HasNotPipe,
    SearchPipe,

    CursorEndDirective,
  ],
  entryComponents: [
    LoginModalComponent,

    AlertModalComponent,
    SelectModalComponent,

    OpenAreaComponent,
    CloseAreaComponent,

    BillModalComponent,
    NewBillComponent,
    OrderModalComponent,
    ProductComponent,
    PayComponent,
    DiscountModalComponent,
    ChangeTableModalComponent,
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
    MatSnackBarModule,

    NgAggregatePipesModule,
    NgArrayPipesModule,
  ],
  providers: [
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ... new MatDialogConfig(), maxHeight: '100%', maxWidth: '100%' }
    },

    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
