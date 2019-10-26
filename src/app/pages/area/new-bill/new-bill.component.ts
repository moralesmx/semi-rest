import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { of, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { FormGroupCustom } from '../../../core/custom-forms/form-group';
import { Table, Waiter } from '../../../core/models';

@Component({
  templateUrl: 'new-bill.component.html'
})
export class NewBillComponent implements OnDestroy {

  static readonly defaultName: string = 'Cliente directo';

  private readonly destroyed: Subject<void> = new Subject();

  public waiters: Waiter[];

  public waiter: FormControl = new FormControl(undefined, [Validators.required]);
  public adults: FormControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  public minors: FormControl = new FormControl(0, [Validators.required, Validators.min(0)]);
  public name: FormControl = new FormControl(NewBillComponent.defaultName, [Validators.required]);
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
    private auth: AuthService,
    private ref: MatDialogRef<NewBillComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {
    this.form.disable();
    this.api.getWaiters().pipe(
      takeUntil(this.destroyed),
    ).subscribe(
      waiters => {
        this.waiters = waiters;
        this.form.enable();
        if (this.waiters.find(waiter => waiter.idpvUsuarios === this.auth.user.idpvUsuarios)) {
          this.waiter.setValue(this.auth.user.idpvUsuarios);
        }
        if (this.auth.user.cajero || this.auth.user.capitan) {
          this.waiter.enable();
        } else {
          this.waiter.disable();
        }
        this.form.disableAndStoreState();
        this.form.enableAndRestoreState();
      }
    );

    this.room.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this.api.getRoom(value || undefined).pipe(
        tap(room => {
          this.guest.setValue(room.idHotel);
          this.name.setValue(room.huesped);
          this.name.disable();
        }),
        catchError(() => {
          this.guest.setValue(undefined);
          this.name.setValue(NewBillComponent.defaultName);
          this.name.enable();
          return of(undefined);
        })
      )),
      takeUntil(this.destroyed)
    ).subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    if (this.form.valid) {
      this.form.disableAndStoreState();
      this.ref.disableClose = true;
      this.api.createBill({
        idpvAreas: this.data.table.idpvAreas,
        idpvAreasMesas: this.data.table.idpvAreasMesas,
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
