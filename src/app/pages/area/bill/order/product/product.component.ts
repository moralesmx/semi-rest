import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin, merge, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../../core/api.service';
import { FormGroupCustom } from '../../../../../core/custom-forms/form-group';
import { Kitchen, Modifier, Order, Product, Term } from '../../../../../core/models';

@Component({
  templateUrl: 'product.component.html'
})
export class ProductComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public kitchens: Kitchen[];

  public product: Product;

  public price: FormControl = new FormControl(undefined, [Validators.required]);
  public quantity: FormControl = new FormControl(1, [Validators.required]);
  public total: FormControl = new FormControl(undefined, [Validators.required]);
  public half: FormControl = new FormControl(false, [Validators.required]);
  public time: FormControl = new FormControl(1, [Validators.required]);
  public sub: FormControl = new FormControl(1, [Validators.required]);
  public kitchen: FormControl = new FormControl(undefined, [Validators.required]);
  public notes: FormControl = new FormControl('', [Validators.required]);
  public form: FormGroupCustom = new FormGroupCustom({
    price: this.price,
    quantity: this.quantity,
    total: this.total,
    half: this.half,
    time: this.time,
    sub: this.sub,
    kitchen: this.kitchen,
    notes: this.notes
  });

  public termsSelection: SelectionModel<Term> = new SelectionModel(true, []);
  public modifiersSelection: SelectionModel<Modifier> = new SelectionModel(true, []);

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ProductComponent, Order>,
    @Inject(MAT_DIALOG_DATA) private data: { product: Product, order?: Order }
  ) {
    this.product = this.data.product;
    this.form.disable();
    forkJoin(
      this.api.getProduct(this.data.product.idpvPlatillos),
      this.api.getKitchens()
    ).pipe(
      takeUntil(this.destroyed)
    ).subscribe(([product, kitchens]) => {
      this.product = product;
      this.kitchens = kitchens;

      this.form.enable();
      if (this.data.order) {
        this.quantity.setValue(this.data.order.cantidad);
        this.total.setValue(this.data.order.total);
        this.half.setValue(this.data.order.media);
        this.time.setValue(this.data.order.tiempo);
        this.sub.setValue(this.data.order.cuenta);
        this.kitchen.setValue(this.data.order.idpvCocinas);
        this.notes.setValue(this.data.order.notas);

        this.product.terminos.filter(term => {
          return this.data.order.terminos.find(_term => {
            return _term.idpvTerminos === term.idpvTerminos;
          });
        }).forEach(term => {
          this.termsSelection.toggle(term);
        });

        this.product.modificadores.filter(modifier => {
          return this.data.order.modificadores.find(_modifier => {
            return _modifier.idpvPlatillosModificadores === modifier.idpvPlatillosModificadores;
          });
        }).forEach(modifier => {
          this.modifiersSelection.toggle(modifier);
        });
      } else {
        this.kitchen.setValue(this.product.idpvCocinas);
      }

      merge(
        this.price.valueChanges,
        this.quantity.valueChanges
      ).pipe(
        takeUntil(this.destroyed)
      ).subscribe(() => {
        this.total.setValue(this.price.value * this.quantity.value);
      });

      merge(
        this.half.valueChanges,
        this.modifiersSelection.changed
      ).pipe(
        startWith(undefined),
        takeUntil(this.destroyed)
      ).subscribe(() => {
        this.price.setValue(
          this.modifiersSelection.selected.reduce((total, modifier) => total + modifier.precio, 0) +
          (this.half.value ? this.product.precioMedia : this.product.precio)
        );
      });

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

      cantidad: this.quantity.value,
      precio: this.price.value,
      total: this.total.value,
      media: this.half.value,
      tiempo: this.time.value,
      cuenta: this.sub.value,
      idpvCocinas: this.kitchen.value,
      modificadores: this.modifiersSelection.selected,
      terminos: this.termsSelection.selected,
      notas: this.notes.value
    });
  }

}
