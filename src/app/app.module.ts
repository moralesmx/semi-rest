import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogConfig, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
// import { NgAggregatePipesModule, NgArrayPipesModule } from 'angular-pipes';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgxCurrencyDirective, provideEnvironmentNgxCurrency } from 'ngx-currency';
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
import { RangePipe } from './pipes/range.pipe';
import { GroupByPipe } from './pipes/group-by.pipe';
import { OrderByPipe } from './pipes/order-by.pipe';

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
    RangePipe,
    GroupByPipe,
    OrderByPipe,

    CursorEndDirective,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,

    AppRoutingModule,

    AngularDraggableModule,
    NgxCurrencyDirective,

    BlockUIModule,

    MatDialogModule,
    MatSnackBarModule,

    // NgAggregatePipesModule,
    // NgArrayPipesModule,
  ],
  providers: [
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ... new MatDialogConfig(), maxHeight: '100%', maxWidth: '100%' }
    },

    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),

    provideEnvironmentNgxCurrency({
      align: 'right',
      prefix: '$',
      precision: 2,
      allowNegative: false,
      allowZero: true,
      decimal: '.',
      thousands: ',',
      nullable: true,
      suffix: ''
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
