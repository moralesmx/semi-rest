import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { EMPTY, forkJoin, Subject } from 'rxjs';
import { catchError, debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ActionsService } from '../../../core/actions.service';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Bill, Command, Room, Table, Waiter } from '../../../core/models';
import { ModalsService } from '../../../modals/modals.service';
import { ChangeTableModalComponent } from './change-table/change-table.component';
import { DiscountModalComponent } from './discount/discount.component';
import { PayComponent } from './pay/pay.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GroupByPipe } from '../../../pipes/group-by.pipe';
import { RangePipe } from '../../../pipes/range.pipe';
import { BlockUIModule } from 'primeng/blockui';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    GroupByPipe,
    RangePipe,
    BlockUIModule
  ],
  templateUrl: 'bill.component.html'
})
export class BillModalComponent implements OnDestroy {

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

  public form = new FormGroup({
    waiter: new FormControl<Waiter['idpvUsuarios']>(undefined, [Validators.required]),
    adults: new FormControl(0, [Validators.required, Validators.min(1)]),
    minors: new FormControl(0, [Validators.required, Validators.min(0)]),
    name: new FormControl(BillModalComponent.defaultName, [Validators.required]),
    room: new FormControl<string>(undefined),
    guest: new FormControl<Room['idHotel']>(undefined),
  });

  constructor(
    private actions: ActionsService,
    private api: ApiService,
    public auth: AuthService,
    private dialog: MatDialog,
    private modals: ModalsService,
    private ref: MatDialogRef<BillModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table; }
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

  public pay(): void {
    this.dialog.open(PayComponent, {
      data: { table: this.data.table, bill: this.bill }
    }).afterClosed().pipe(
      takeUntil(this.destroyed)
    ).subscribe(result => {
      if (result) {
        this.ref.close();
      }
    });
  }

  public discount(): void {
    this.dialog.open(DiscountModalComponent, {
      data: {
        table: this.data.table,
        bill: this.bill
      }
    }).afterClosed().pipe(
      takeUntil(this.destroyed)
    ).subscribe(result => {
      if (result) {
        this.loadBill();
      }
    });
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

  public changeTable(): void {
    this.dialog.open(ChangeTableModalComponent, {
      data: {
        table: this.data.table
      }
    }).afterClosed().subscribe({
      next: changed => {
        if (changed) {
          this.loadBill();
        }
      }
    });
  }

  public async cancelCommand(command: Command): Promise<void> {
    if (await this.modals.alert({
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
    if (await this.modals.alert({
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
    this.actions.order(this.data.table.idpvAreasMesas);
  }

  public async printCheck(): Promise<void> {
    if (await this.modals.alert({
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
