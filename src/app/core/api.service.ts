import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Area, Bill, Command, Kitchen, PaymentOption, Printer, Product, Room, Table, User, Waiter } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // public url: string = 'http://7.7.7.107:5000/punto-de-venta/pos';
  public url: string = 'http://192.168.195.96:5000/punto-de-venta/pos';

  // public url: string = 'http://localhost:5000/punto-de-venta/pos';
  // public url: string = 'http://25.66.208.206:5000/punto-de-venta/pos';
  // public url: string = 'http://7.7.7.107:5000/punto-de-venta/pos';
  // public url: string = 'http://192.168.10.34:5000/punto-de-venta/pos';
  // public url: string = 'http://192.168.10.147:5000/punto-de-venta/pos';
  // public url: string = 'http://192.168.1.179:5000/punto-de-venta/pos';
  // public url: string = 'http://192.168.43.187:5000/punto-de-venta/pos';
  // public url: string = 'http://192.168.1.153:5000/punto-de-venta/pos';
  // public url: string = 'http://casablanca.myserver100.com:5000/punto-de-venta/pos';

  constructor(
    private http: HttpClient
  ) { }

  public getWaiters(): Observable<Waiter[]> {
    return this.http.get<Waiter[]>(`${this.url}/meseros`);
  }

  public getPaymentOptions(): Observable<PaymentOption[]> {
    return this.http.get<PaymentOption[]>(`${this.url}/formas-de-pago`);
  }

  public payBill(bill: Bill, body: any): Observable<any> {
    return this.http.post<any>(`${this.url}/cuentas/${bill.idpvVentas}`, body);
  }

  public discount(bill: Bill, body: any): Observable<any> {
    return this.http.put<any>(`${this.url}/cuentas/${bill.idpvVentas}/descuentos`, body);
  }

  public printCheck(bill: Bill): Observable<any> {
    return this.http.get<any>(`${this.url}/cuentas/${bill.idpvVentas}/cheque`);
  }

  public changeSub(command: Command, sub: Command['cuenta']): Observable<any> {
    return this.http.put<any>(`${this.url}/comandas/${command.idpvComandas}`, { cuenta: sub });
  }

  public cancelCommand(commandId: Command['idpvComandas'], userId: User['idpvUsuarios']): Observable<any> {
    return this.http.delete<any>(`${this.url}/comandas/${commandId}`, {
      params: {
        idpvUsuarios: `${userId}`
      }
    });
  }

  public getKitchens(): Observable<Kitchen[]> {
    return this.http.get<Kitchen[]>(`${this.url}/cocinas`);
  }

  public getPrinters(): Observable<Printer[]> {
    return this.http.get<Printer[]>(`${this.url}/impresoras`);
  }

  public printOrder(id: Command['idpvVentas'], folio: Command['folio'], printer?: Printer['idgeneralImpresoras']): Observable<any> {
    const params: { [key: string]: string } = {};
    if (printer) {
      params.copia = printer.toString();
    }
    return this.http.get<any>(`${this.url}/comandas/${id}/${folio}`, { params });
  }

  public getRoom(room: string): Observable<Room> {
    return this.http.get<Room>(`${this.url}/hotel/${room}`);
  }

  public sendOrder(id: Bill['idpvVentas'], order: any): Observable<any> {
    return this.http.post(`${this.url}/cuentas/${id}/comanda`, order);
  }

  public createBill(bill: Partial<Bill>): Observable<any> {
    return this.http.post(`${this.url}/cuentas`, bill);
  }

  public updateBill(bill: Partial<Bill>): Observable<any> {
    return this.http.put<any>(`${this.url}/cuentas/${bill.idpvVentas}`, bill);
  }

  public getBill(id: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.url}/cuentas/${id}`);
  }

  public getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/platillos`);
  }

  public getProduct(id: Product['idpvPlatillos']): Observable<Product> {
    return this.http.get<Product>(`${this.url}/platillos/${id}`);
  }

  public getTable(id: Table['idpvAreasMesas']): Observable<Table> {
    return this.http.get<Table>(`${this.url}/cuentasm/${id}`);
  }

  public getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.url}/areas`);
  }

  public getArea(id: number): Observable<Area> {
    return this.http.get<Area>(`${this.url}/areas/${id}`);
  }

  public updateArea(area: Area): Observable<any> {
    return this.http.put(`${this.url}/areas/${area.idpvAreas}`, area);
  }

  public openArea(area: Area, user: User, funds: number): Observable<any> {
    return this.http.post(`${this.url}/areas/${area.idpvAreas}/corte`, {
      idpvUsuarios: user.idpvUsuarios,
      fondo: funds
    });
  }

  public closeArea(area: Area, user: User, payments: any): Observable<any> {
    return this.http.put(`${this.url}/areas/${area.idpvAreas}/corte`, {
      idpvUsuarios: user.idpvUsuarios,
      idpvCortes: area.idpvCortes,
      formadepago: payments
    });
  }

}
