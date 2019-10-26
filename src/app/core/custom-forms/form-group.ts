import { Directive, Self } from '@angular/core';
import { FormControlName, FormGroup, FormGroupName, FormArrayName } from '@angular/forms';

export class FormGroupCustom extends FormGroup {

  private storedState: { [key: string]: boolean } = {};

  constructor(...args: ConstructorParameters<typeof FormGroup>) {
    super(...args);
  }

  public disableAndStoreState(...args: Parameters<typeof FormGroup.prototype.disable>) {
    this.storedState = {};
    for (const [name, control] of Object.entries(this.controls)) {
      this.storedState[name] = control.disabled;
      if (control instanceof FormGroupCustom) {
        control.disableAndStoreState(...args);
      }
    }
    this.disable(...args);
  }

  public enableAndRestoreState(...args: Parameters<typeof FormGroup.prototype.enable>) {
    this.enable(...args);
    for (const [name, control] of Object.entries(this.controls)) {
      if (control instanceof FormGroupCustom) {
        control.enableAndRestoreState(...args);
      }
      if (this.storedState[name]) {
        control.disable(...args);
      }
    }
  }

}
