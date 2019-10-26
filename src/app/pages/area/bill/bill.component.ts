import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { FormGroupCustom } from '../../../core/custom-forms/form-group';
import { Bill, Command, Table, Waiter } from '../../../core/models';
import { DiscountComponent } from './discount/discount.component';
import { PayComponent } from './pay/pay.component';
import { ChangeTableComponent } from './change-table/change-table.component';

@Component({
  templateUrl: 'bill.component.html'
})
export class BillComponent implements OnDestroy {

  static readonly defaultName: string = 'Cliente directo';

  private readonly destroyed: Subject<void> = new Subject();

  public waiters: Waiter[];

  public bill: Bill;

  public waiter: FormControl = new FormControl(undefined, [Validators.required]);
  public adults: FormControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  public minors: FormControl = new FormControl(0, [Validators.required, Validators.min(0)]);
  public name: FormControl = new FormControl(BillComponent.defaultName, [Validators.required]);
  public room: FormControl = new FormControl(undefined);
  public guest: FormControl = new FormControl(undefined);
  public form: FormGroupCustom = new FormGroupCustom({
    waiter: this.waiter,
    adults: this.adults,
    minors: this.minors,
    name: this.name,
    room: this.room,
    guest: this.guest,
  });

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private dialog: MatDialog,
    private ref: MatDialogRef<BillComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {
    if (this.auth.user.cajero || this.auth.user.capitan) {
      this.waiter.enable();
    } else {
      this.waiter.disable();
    }
    this.guest.valueChanges.subscribe(value => {
      if (value) {
        this.name.disable();
      } else {
        this.name.enable();
      }
    });
    this.room.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this.api.getRoom(value || undefined).pipe(
        tap(room => {
          this.guest.setValue(room.idHotel);
          this.name.setValue(room.huesped);
        }),
        catchError(() => {
          this.guest.setValue(undefined);
          this.name.setValue(BillComponent.defaultName);
          return of(undefined);
        })
      )),
      takeUntil(this.destroyed)
    ).subscribe();

    this.loadBill();
  }

  public loadBill(): void {
    this.form.disableAndStoreState({ emitEvent: false });
    forkJoin(
      this.api.getWaiters(),
      this.api.getBill(this.data.table.idpvVentas)
    ).pipe(
      takeUntil(this.destroyed)
    ).subscribe(([waiters, bill]) => {
      this.waiters = waiters;
      this.bill = bill;
      this.form.enableAndRestoreState({ emitEvent: false });
      this.waiter.setValue(bill.idpvUsuariosMesero);
      this.adults.setValue(bill.adultos);
      this.minors.setValue(bill.menores);
      this.name.setValue(bill.nombre);
      this.guest.setValue(bill.idHotel);
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
    this.form.disableAndStoreState({ emitEvent: false });
    this.api.changeSub(command, sub).subscribe(
      () => {
        this.form.enableAndRestoreState({ emitEvent: false });
        this.loadBill();
      },
      error => {
        console.error(error);
        this.form.enableAndRestoreState({ emitEvent: false });
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

  public cancelCommand(command: Command): void {
    this.form.disableAndStoreState({ emitEvent: false });
    this.api.cancelCommand(command).subscribe(
      () => {
        this.form.enableAndRestoreState({ emitEvent: false });
        this.loadBill();
      },
      error => {
        console.error(error);
        this.form.enableAndRestoreState({ emitEvent: false });
        this.loadBill();
      }
    );
  }

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    if (this.form.valid) {
      this.form.disableAndStoreState({ emitEvent: false });
      this.ref.disableClose = true;
      this.api.updateBill({
        idpvVentas: this.data.table.idpvVentas,
        idpvUsuariosMesero: this.waiter.value,
        adultos: this.adults.value,
        menores: this.minors.value,
        nombre: this.name.value,
        idHotel: this.guest.value
      }).pipe(
        takeUntil(this.destroyed)
      ).subscribe(
        () => {
          this.ref.close();
        },
        error => {
          console.log(error);
          this.form.enableAndRestoreState({ emitEvent: false });
          this.ref.disableClose = false;
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

}
