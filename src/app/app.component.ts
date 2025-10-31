import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoginModalComponent } from './modals/login/login.component';

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  private dialog = inject(MatDialog);

  constructor() {
    LoginModalComponent.open(this.dialog);
  }
}
