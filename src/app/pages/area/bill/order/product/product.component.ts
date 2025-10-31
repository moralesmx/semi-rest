import { SelectionModel } from '@angular/cdk/collections';
import { CurrencyPipe } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest, firstValueFrom, forkJoin, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../../core/api.service';
import { Kitchen, Modifier, Order, Product, Term } from '../../../../../core/models';
import { RangePipe } from '../../../../../pipes/range.pipe';

interface ProductModalData {
  product: Product | Order;
  order?: Order;
}
type ProductModalReturn = Order | undefined;

@Component({
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatListModule,
    RangePipe
  ],
  templateUrl: 'product.component.html'
})
export class ProductModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, product: Product | Order, order?: Order) {
    return firstValueFrom(dialog.open<ProductModalComponent, ProductModalData, ProductModalReturn>(ProductModalComponent, {
      data: { product, order }
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

  public kitchens: Kitchen[];

  public product: Product;

  public form = new FormGroup({
    price: new FormControl<number>(undefined, [Validators.required]),
    quantity: new FormControl(1, [Validators.required]),
    total: new FormControl<number>(undefined, [Validators.required]),
    half: new FormControl(false, [Validators.required]),
    time: new FormControl(1, [Validators.required]),
    sub: new FormControl(1, [Validators.required]),
    kitchen: new FormControl<Kitchen['idpvCocinas']>(undefined, [Validators.required]),
    notes: new FormControl('', [Validators.required]),
  });

  public termsSelection: SelectionModel<Term> = new SelectionModel(true, []);
  public modifiersSelection: SelectionModel<Modifier> = new SelectionModel(true, []);

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ProductModalComponent, ProductModalReturn>,
    @Inject(MAT_DIALOG_DATA) private data: ProductModalData
  ) {
    this.product = this.data.product as Product;

    combineLatest([
      this.form.controls.price.valueChanges.pipe(
        startWith(this.form.value.price)
      ),
      this.form.controls.quantity.valueChanges.pipe(
        startWith(this.form.value.quantity)
      )
    ]).pipe(
      map(([price, quantity]) => price * quantity),
      takeUntil(this.destroyed)
    ).subscribe(total => {
      this.form.controls.total.setValue(total);
    });

    combineLatest([
      this.form.controls.half.valueChanges.pipe(
        startWith(this.form.value.half),
        map(value => value ? this.product.precioMedia : this.product.precio),
        map(value => value || 0)
      ),
      this.modifiersSelection.changed.pipe(
        map(value => value.source.selected.reduce((total, modifier) => total + modifier.precio, 0)),
        startWith(0)
      )
    ]).pipe(
      map(([price, modifiers]) => price + modifiers),
      takeUntil(this.destroyed)
    ).subscribe(price => {
      this.form.controls.price.setValue(price);
    });

    this.form.disable();
    this.ref.disableClose = this.form.disabled;
    forkJoin([
      this.api.getProduct(this.data.product.idpvPlatillos),
      this.api.getKitchens()
    ]).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: ([product, kitchens]) => {
        this.product = product;
        this.kitchens = kitchens;

        if (this.data.order) {
          this.form.patchValue({
            quantity: this.data.order.cantidad,
            total: this.data.order.total,
            half: this.data.order.media,
            time: this.data.order.tiempo,
            sub: this.data.order.cuenta,
            kitchen: this.data.order.idpvCocinas,
            notes: this.data.order.notas,
          });

          for (const term of this.product.terminos) {
            const selected: boolean = this.data.order.terminos.some(_term => {
              return _term.idpvTerminos === term.idpvTerminos;
            });
            if (selected) {
              this.termsSelection.toggle(term);
            }
          }

          for (const modifier of this.product.modificadores) {
            const selected: boolean = this.data.order.modificadores.some(_modifier => {
              return _modifier.idpvPlatillosModificadores === modifier.idpvPlatillosModificadores;
            });
            if (selected) {
              this.modifiersSelection.toggle(modifier);
            }
          }
        } else {
          this.form.patchValue({
            kitchen: this.product.idpvCocinas,
            half: false,
          });
        }
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
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

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    this.ref.close({
      idpvPlatillos: this.product.idpvPlatillos,
      nombre: this.product.nombre,

      cantidad: this.form.value.quantity,
      precio: this.form.value.price,
      total: this.form.value.total,
      media: this.form.value.half,
      tiempo: this.form.value.time,
      cuenta: this.form.value.sub,
      idpvCocinas: this.form.value.kitchen,
      modificadores: this.modifiersSelection.selected,
      terminos: this.termsSelection.selected,
      notas: this.form.value.notes
    });
  }

}
