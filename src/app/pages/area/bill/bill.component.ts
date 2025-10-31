import { CurrencyPipe } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { EMPTY, firstValueFrom, forkJoin, Subject } from 'rxjs';
import { catchError, debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Bill, Command, Room, Table, Waiter } from '../../../core/models';
import { AlertModalComponent } from '../../../modals/alert/alert.component';
import { RangePipe } from '../../../pipes/range.pipe';
import { ChangeTableModalComponent } from './change-table/change-table.component';
import { DiscountModalComponent } from './discount/discount.component';
import { OrderModalComponent } from './order/order.component';
import { PayModalComponent } from './pay/pay.component';

interface BillModalData {
  table: Table;
}
type BillModalReturn = void;

@Component({
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    RangePipe
  ],
  templateUrl: 'bill.component.html'
})
export class BillModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, table: Table) {
    return firstValueFrom(dialog.open<BillModalComponent, BillModalData, BillModalReturn>(BillModalComponent, {
      data: { table }
    }).afterClosed());
  }

  static readonly defaultName: string = 'Cliente directo';

  private readonly destroyed: Subject<void> = new Subject<void>();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public waiters: Waiter[];
  public bill: Bill;

  public displayedColumns: string[] = ['folio', 'cuenta', 'platillo', 'cantidad', 'precio', 'total', 'actions'];

  public form = new FormGroup({
    waiter: new FormControl<Waiter['idpvUsuarios']>(undefined, [Validators.required]),
    adults: new FormControl(0, [Validators.required, Validators.min(1)]),
    minors: new FormControl(0, [Validators.required, Validators.min(0)]),
    name: new FormControl(BillModalComponent.defaultName, [Validators.required]),
    room: new FormControl<string>(undefined),
    guest: new FormControl<Room['idHotel']>(undefined),
  });

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private dialog: MatDialog,
    private ref: MatDialogRef<BillModalComponent, BillModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: BillModalData
  ) {
    if (this.auth.user.permisos.cambiomesero) {
      this.form.controls.waiter.enable();
    } else {
      this.form.controls.waiter.disable();
    }


    this.form.controls.room.valueChanges.pipe(
      tap(() => {
        this.form.controls.guest.setValue(undefined);
        this.form.controls.name.setValue(BillModalComponent.defaultName);
        this.form.controls.name.enable();
      }),
      debounceTime(300),
      filter(value => !!value),
      switchMap(value => {
        return this.api.getRoom(value).pipe(
          catchError(() => EMPTY)
        );
      }),
      takeUntil(this.destroyed)
    ).subscribe({
      next: room => {
        this.form.controls.guest.setValue(room.idHotel);
        this.form.controls.name.setValue(room.huesped);
        this.form.controls.name.disable();
      }
    });

    this.loadBill();
  }

  public loadBill(): void {
    this.loading = true;
    forkJoin(
      this.api.getWaiters(),
      this.api.getBill(this.data.table.idpvVentas)
    ).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: ([waiters, bill]) => {
        this.waiters = waiters;
        this.bill = bill;
        this.form.patchValue({
          waiter: bill.idpvUsuariosMesero,
          adults: bill.adultos,
          minors: bill.menores,
          name: bill.nombre,
          guest: bill.idHotel,
          room: bill.habitacion,
        });
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

  public async pay(): Promise<void> {
    const result = await PayModalComponent.open(this.dialog, this.data.table, this.bill);
    if (result) {
      this.ref.close();
    }
  }

  public async discount(): Promise<void> {
    const result = await DiscountModalComponent.open(this.dialog, this.data.table, this.bill);
    if (result) {
      this.loadBill();
    }
  }

  public changeSub(command: Command, sub: number): void {
    this.loading = true;
    this.api.changeSub(command, sub).subscribe(
      () => {
        this.loading = false;
        this.loadBill();
      },
      error => {
        console.error(error);
        this.loading = false;
        this.loadBill();
      }
    );
  }

  public async changeTable(): Promise<void> {
    const changed = await ChangeTableModalComponent.open(this.dialog, this.data.table);
    if (changed) {
      this.loadBill();
    }
  }

  public async cancelCommand(command: Command): Promise<void> {
    if (await AlertModalComponent.open(this.dialog, {
      title: 'Cancelar movimiento',
      message: '¿Esta seguro de que desea cancelar el movimiento?',
      ok: 'Si',
      cancel: 'No'
    })) {
      this.loading = true;
      this.api.cancelCommand(command.idpvComandas, this.auth.user.idpvUsuarios).subscribe(
        () => {
          this.loadBill();
          this.loading = false;
        },
        error => {
          console.error(error);
          this.loadBill();
          this.loading = false;
        }
      );
    }
  }

  public async printOrder(command: Command): Promise<void> {
    if (await AlertModalComponent.open(this.dialog, {
      title: 'Reimprimir comanda',
      message: '¿Esta seguro de que desea reimprimir la comanda?',
      ok: 'Si',
      cancel: 'No'
    })) {
      this.loading = true;
      this.api.printOrder(command.idpvVentas, command.folio).subscribe({
        next: () => {
          this.loading = false;
        },
        error: error => {
          console.error(error);
          this.loading = false;
        }
      });
    }
  }

  public async order(): Promise<void> {
    this.ref.close();
    OrderModalComponent.open(this.dialog, this.data.table.idpvAreasMesas);
  }

  public async printCheck(): Promise<void> {
    if (await AlertModalComponent.open(this.dialog, {
      title: 'Imprimir cheque',
      message: '¿Esta seguro de que desea imprimir cheque?',
      ok: 'Si',
      cancel: 'No'
    })) {
      this.loading = true;
      this.api.printCheck(this.bill.idpvVentas).subscribe({
        next: () => {
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.api.updateBill({
      idpvVentas: this.data.table.idpvVentas,
      idpvUsuariosMesero: this.form.controls.waiter.value,
      adultos: this.form.controls.adults.value,
      menores: this.form.controls.minors.value,
      nombre: this.form.controls.name.value,
      idHotel: this.form.controls.guest.value,
      habitacion: this.form.value.guest ? this.form.value.room : undefined
    }).pipe(
      takeUntil(this.destroyed)
    ).subscribe(
      () => {
        this.ref.close();
        this.loading = false;
      },
      error => {
        console.log(error);
        this.loading = false;
      }
    );
  }

}
