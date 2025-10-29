import { Component } from '@angular/core';
import { ModalsService } from './modals/modals.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(
    private modals: ModalsService
  ) {
    this.modals.login();
  }
}
