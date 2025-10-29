import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BlockUIModule } from 'primeng/blockui';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderByPipe } from 'src/app/pipes/order-by.pipe';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { Order, Printer, Product, Table } from '../../../../core/models';
import { GroupByPipe } from '../../../../pipes/group-by.pipe';
import { ProductComponent } from './product/product.component';

export interface OrderModalData {
  tableId: Table['idpvAreasMesas'];
}
export type OrderModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    GroupByPipe,
    OrderByPipe,
    BlockUIModule,
  ],
  templateUrl: 'order.component.html',
})
export class OrderModalComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public activeGroup: any;
  public activeClass: any;

  public table: Table;
  public products: Product[];
  public printers: Printer[];

  public orders: Order[] = [];

  public form = new FormGroup({
    printer: new FormControl<Printer['idgeneralImpresoras']>(undefined),
    copy: new FormControl(false),
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private ref: MatDialogRef<OrderModalComponent, OrderModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: OrderModalData
  ) {
    this.loading = true;
    forkJoin(
      this.api.getProducts(),
      this.api.getPrinters(),
      this.api.getTable(this.data.tableId)
    ).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: ([products, printers, table]) => {
        this.products = products;
        this.printers = printers;
        this.table = table;

        this.form.controls.copy.valueChanges.pipe(
          takeUntil(this.destroyed)
        ).subscribe(value => {
          if (value) {
            this.form.controls.printer.enable();
          } else {
            this.form.controls.printer.disable();
          }
        });

        if (this.printers.length) {
          this.form.controls.printer.setValue(this.printers[0].idgeneralImpresoras);
        } else {
          this.form.controls.copy.disable();
        }
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public selectProduct(product: Product): void {
    this.dialog.open(ProductComponent, {
      data: { product }
    }).afterClosed().pipe(
      takeUntil(this.destroyed)
    ).subscribe(order => {
      if (order) {
        this.orders.push(order);
      }
    });
  }

  public selectOrder(order: Order): void {
    this.dialog.open(ProductComponent, {
      data: { product: order, order }
    }).afterClosed().pipe(
      takeUntil(this.destroyed)
    ).subscribe(_order => {
      if (_order) {
        this.orders[this.orders.indexOf(order)] = _order;
      }
    });
  }

  public removeOrder(order: Order): void {
    this.orders.splice(this.orders.indexOf(order), 1);
  }


  public cancel(): void {
    this.ref.close(false);
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.api.sendOrder(this.table.idpvVentas, {
      idpvVentas: this.table.idpvVentas,
      idpvUsuarios: this.auth.user.idpvUsuarios,
      platillos: this.orders
    }).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: ({ folio }: { folio: number; }) => {
        this.api.printOrder(
          this.table.idpvVentas,
          folio,
          this.form.controls.copy.value ? this.form.controls.printer.value : undefined
        ).subscribe(
          console.log,
          console.error,
          console.warn
        );
        this.ref.close(true);
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

}
