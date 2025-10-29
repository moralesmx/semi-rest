import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snack: MatSnackBar
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = Date.now();
    return next.handle(req).pipe(
      catchError(error => {
        console.log(error);
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 401:
            case 403:
              this.snack.open(error.error, 'Aceptar', { duration: 5000 });
              break;
            case 500:
              this.snack.open('Error del servidor', 'Aceptar');
              break;
            default:
              this.snack.open(error.message, 'Aceptar');
              break;
          }
        }
        return throwError(error);
      })
    );
  }
}
