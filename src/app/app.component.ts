import { Component } from '@angular/core';
import { LoginService } from './pages/login/login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(
    private login: LoginService
  ) {
    this.login.login();
  }
}
