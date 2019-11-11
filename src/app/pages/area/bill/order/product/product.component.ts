import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { combineLatest, forkJoin, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../../core/api.service';
import { Kitchen, Modifier, Order, Product, Term } from '../../../../../core/models';

@Component({
  templateUrl: 'product.component.html'
})
export class ProductComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public kitchens: Kitchen[];

  public product: Product;

  public form: FormGroupTyped<{
    price: number;
    quantity: number;
    total: number;
    half: boolean;
    time: number;
    sub: number;
    kitchen: Kitchen['idpvCocinas'];
    notes: string;
  }> = new FormGroup({
    price: new FormControl(undefined, [Validators.required]),
    quantity: new FormControl(1, [Validators.required]),
    total: new FormControl(undefined, [Validators.required]),
    half: new FormControl(false, [Validators.required]),
    time: new FormControl(1, [Validators.required]),
    sub: new FormControl(1, [Validators.required]),
    kitchen: new FormControl(undefined, [Validators.required]),
    notes: new FormControl('', [Validators.required]),
  }) as any;

  public termsSelection: SelectionModel<Term> = new SelectionModel(true, []);
  public modifiersSelection: SelectionModel<Modifier> = new SelectionModel(true, []);

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ProductComponent, Order>,
    @Inject(MAT_DIALOG_DATA) private data: { product: Product, order?: Order }
  ) {
    this.product = this.data.product;

    combineLatest(
      this.form.controls.price.valueChanges.pipe(
        startWith(this.form.value.price)
      ),
      this.form.controls.quantity.valueChanges.pipe(
        startWith(this.form.value.quantity)
      )
    ).pipe(
      map(([price, quantity]) => price * quantity),
      takeUntil(this.destroyed)
    ).subscribe(total => {
      this.form.controls.total.setValue(total);
    });

    combineLatest(
      this.form.controls.half.valueChanges.pipe(
        startWith(this.form.value.half),
        map(value => value ? this.product.precioMedia : this.product.precio),
        map(value => value || 0)
      ),
      this.modifiersSelection.changed.pipe(
        map(value => value.source.selected.reduce((total, modifier) => total + modifier.precio, 0)),
        startWith(0)
      )
    ).pipe(
      map(([price, modifiers]) => price + modifiers),
      takeUntil(this.destroyed)
    ).subscribe(price => {
      this.form.controls.price.setValue(price);
    });

    this.loading = true;
    forkJoin(
      this.api.getProduct(this.data.product.idpvPlatillos),
      this.api.getKitchens()
    ).pipe(
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
