import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { FormGroupCustom } from '../../../../core/custom-forms/form-group';
import { Order, Printer, Product, Table } from '../../../../core/models';
import { ModalsService } from '../../../../modals/modals.service';
import { ProductComponent } from './product/product.component';

@Component({
  templateUrl: 'order.component.html',
})
export class OrderComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public activeGroup: any;
  public activeClass: any;

  public products: Product[];
  public printers: Printer[];

  public orders: Order[] = [];

  public printer: FormControl = new FormControl(undefined);
  public copy: FormControl = new FormControl(false);
  public form: FormGroupCustom = new FormGroupCustom({
    printer: this.printer,
    copy: this.copy,
    dummy: new FormControl(undefined)
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private modals: ModalsService,
    private ref: MatDialogRef<OrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {
    this.form.disable();
    forkJoin(
      this.api.getProducts(),
      this.api.getPrinters(),
    ).pipe(
      takeUntil(this.destroyed)
    ).subscribe(
      ([products, printers]) => {
        this.products = products;
        this.printers = printers;

        this.form.enable();
        if (this.printers.length) {
          this.printer.setValue(this.printers[0].idgeneralImpresoras);
        } else {
          this.copy.disable();
        }
        this.copy.valueChanges.pipe(
          startWith(this.copy.value),
          takeUntil(this.destroyed)
        ).subscribe(value => {
          value ? this.printer.enable() : this.printer.disable();
        });
      }
    );
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
    if (this.form.valid) {
      this.form.disableAndStoreState();
      this.ref.disableClose = true;
      this.api.sendOrder(this.data.table.idpvVentas, {
        idpvVentas: this.data.table.idpvVentas,
        idpvUsuarios: this.auth.user.idpvUsuarios,
        platillos: this.orders
      }).pipe(
        takeUntil(this.destroyed)
      ).subscribe(
        ({ folio }: { folio: number }) => {
          this.ref.close(true);
          this.api.printOrder(this.data.table.idpvVentas, folio, this.printer.value).subscribe(
            console.log,
            console.error,
            console.warn
          );
        },
        error => {
          this.form.enableAndRestoreState();
          this.ref.disableClose = false;
          console.error(error);
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

}
