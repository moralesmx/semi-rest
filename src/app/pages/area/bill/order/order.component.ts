import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderByPipe } from 'src/app/pipes/order-by.pipe';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { Order, Printer, Product, Table } from '../../../../core/models';
import { GroupByPipe, Grouped } from '../../../../pipes/group-by.pipe';
import { ProductModalComponent } from './product/product.component';

interface OrderModalData {
  tableId: Table['idpvAreasMesas'];
}
type OrderModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatProgressBarModule,
    GroupByPipe,
    OrderByPipe
  ],
  templateUrl: 'order.component.html',
})
export class OrderModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, tableId: Table['idpvAreasMesas']) {
    return firstValueFrom(dialog.open<OrderModalComponent, OrderModalData, OrderModalReturn>(OrderModalComponent, {
      data: { tableId },
      minWidth: '100%',
      minHeight: '100%'
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

  public activeGroup?: Grouped<Product>;
  public activeClass?: Grouped<Product>;

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
    this.form.controls.copy.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(value => {
      if (value) {
        this.form.controls.printer.enable();
      } else {
        this.form.controls.printer.disable();
      }
    });

    this.form.disable();
    this.ref.disableClose = this.form.disabled;
    forkJoin([
      this.api.getProducts(),
      this.api.getPrinters(),
      this.api.getTable(this.data.tableId)
    ]).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: ([products, printers, table]) => {
        this.products = products;
        this.printers = printers;
        this.table = table;

        this.form.enable();
        this.ref.disableClose = this.form.disabled;

        if (this.printers.length) {
          this.form.controls.printer.setValue(this.printers[0].idgeneralImpresoras);
        } else {
          this.form.controls.copy.disable();
        }

        this.form.controls.copy.setValue(this.form.value.copy);
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public async selectProduct(product: Product): Promise<void> {
    const order = await ProductModalComponent.open(this.dialog, product);
    if (order) {
      this.orders.push(order);
    }
  }

  public async selectOrder(order: Order): Promise<void> {
    const _order = await ProductModalComponent.open(this.dialog, order, order);
    if (_order) {
      this.orders[this.orders.indexOf(order)] = _order;
    }
  }

  public removeOrder(order: Order): void {
    this.orders.splice(this.orders.indexOf(order), 1);
  }


  public cancel(): void {
    this.ref.close(false);
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.value;

    this.form.disable();
    this.ref.disableClose = this.form.disabled;
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
          value.copy ? value.printer : undefined
        ).subscribe(
          console.log,
          console.error,
          console.warn
        );
        this.ref.close(true);
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
      }
    });
  }

}
