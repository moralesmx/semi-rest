import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EMPTY, forkJoin, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ActionsService } from '../../../core/actions.service';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Bill, Command, Room, Table, Waiter } from '../../../core/models';
import { ModalsService } from '../../../modals/modals.service';
import { ChangeTableComponent } from './change-table/change-table.component';
import { DiscountComponent } from './discount/discount.component';
import { PayComponent } from './pay/pay.component';

@Component({
  templateUrl: 'bill.component.html'
})
export class BillComponent implements OnDestroy {

  static readonly defaultName: string = 'Cliente directo';

  private readonly destroyed: Subject<void> = new Subject<void>();

  public loading: boolean;

  public waiters: Waiter[];
  public bill: Bill;

  public form: FormGroupTyped<{
    waiter: Waiter['idpvUsuarios'],
    adults: number,
    minors: number,
    name: string,
    room: string,
    guest: Room['idHotel']
  }> = new FormGroup({
    waiter: new FormControl(undefined, [Validators.required]),
    adults: new FormControl(0, [Validators.required, Validators.min(1)]),
    minors: new FormControl(0, [Validators.required, Validators.min(0)]),
    name: new FormControl(BillComponent.defaultName, [Validators.required]),
    room: new FormControl(undefined),
    guest: new FormControl(undefined),
  }) as FormGroupTyped<any>;

  constructor(
    private actions: ActionsService,
    private api: ApiService,
    public auth: AuthService,
    private dialog: MatDialog,
    private modals: ModalsService,
    private ref: MatDialogRef<BillComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {
    if (this.auth.user.cajero || this.auth.user.capitan) {
      this.form.controls.waiter.enable();
    } else {
      this.form.controls.waiter.disable();
    }
    this.form.controls.guest.valueChanges.subscribe(value => {
      if (value) {
        this.form.controls.name.disable();
      } else {
        this.form.controls.name.enable();
      }
    });
    this.form.controls.room.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this.api.getRoom(value || undefined).pipe(
        tap(room => {
          this.form.controls.guest.setValue(room.idHotel);
          this.form.controls.name.setValue(room.huesped);
        }),
        catchError(() => {
          this.form.controls.guest.setValue(undefined);
          this.form.controls.name.setValue(BillComponent.defaultName);
          return EMPTY;
        })
      )),
      takeUntil(this.destroyed)
    ).subscribe();

    this.loadBill();
  }

  public loadBill(): void {
    this.loading = true;
    forkJoin(
      this.api.getWaiters(),
      this.api.getBill(this.data.table.idpvVentas)
    ).pipe(
      takeUntil(this.destroyed)
    ).subscribe(([waiters, bill]) => {
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
    this.dialog.open(DiscountComponent, {
      data: { table: this.data.table, bill: this.bill }
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
    this.dialog.open(ChangeTableComponent, {
      data: {
        table: this.data.table
      }
    }).afterClosed().subscribe(
      // TODO Aqui me quede
    );
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
    this.loading = true;
    this.api.printCheck(this.bill).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    if (this.form.valid) {
      this.loading = true;
      this.ref.disableClose = true;
      this.api.updateBill({
        idpvVentas: this.data.table.idpvVentas,
        idpvUsuariosMesero: this.form.controls.waiter.value,
        adultos: this.form.controls.adults.value,
        menores: this.form.controls.minors.value,
        nombre: this.form.controls.name.value,
        idHotel: this.form.controls.guest.value
      }).pipe(
        takeUntil(this.destroyed)
      ).subscribe(
        () => {
          this.ref.close();
        },
        error => {
          console.log(error);
          this.loading = false;
          this.ref.disableClose = false;
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

}
