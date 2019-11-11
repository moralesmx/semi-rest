export interface User {
  clave: string;
  estatus: number;
  idpvUsuarios: number;
  nombre: string;
  usuario: string;
  permisos: {
    cortes: boolean,
    cancelaciones: boolean,
    imprimircheque: boolean,
    cobrar: boolean,
    descuentos: boolean,
    cambiomesa: boolean,
    revivir: boolean,
    comandarotros: boolean,
    cambiomesero: boolean,
    edit: boolean
  };
}

export interface Area {
  idpvAreas: number;
  idpvCortes: number;
  nombre: string;
  secciones: Section[];
}

export interface Section {
  idpvAreas: number;
  idpvSecciones: number;
  mesas: Table[];
  nombre: string;
  proporcion: number;
}

export interface Table {
  clave: string;
  coordX: number;
  coordY: number;
  idpvAreas: number;
  idpvAreasMesas: number;
  idpvSecciones: number;
  idpvUsuarios: number;
  idpvVentas: number;
  mesero: string;
  paraLlevar: number;
  total: number;
  habitacion: string;
  area: string;
}

export interface Waiter {
  idpvUsuarios: number;
  nombre: string;
}

export interface Room {
  huesped: string;
  idHotel: number;
}

export interface Product {
  costo: number;
  idpvClasificaciones: number;
  idpvGrupos: number;
  idpvPlatillos: number;
  idpvCocinas: number;
  iva: number;
  modificadores: Modifier[];
  nombre: string;
  precio: number;
  precioMedia: number;
  terminos: Term[];

  grupo: string;
  clasificacion: string;
  color: string;
}

export interface Order {
  idpvPlatillos: number;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  media: boolean;
  tiempo: number;
  cuenta: number;
  idpvCocinas: number;
  modificadores: Modifier[];
  terminos: Term[];
  notas: string;
}

export interface Modifier {
  costo: number;
  idpvPlatillos: number;
  idpvPlatillosModificadores: number;
  nombre: string;
  precio: number;
}

export interface Term {
  idpvTerminos: number;
  nombre: string;
}

export interface Bill {
  adultos: number;
  comandas: Command[];
  credito: number;
  descuentos: number;
  descuento: number;
  descuentoTipo: number;
  estatus: number;
  fechaf: null;
  fechai: string;
  idHotel: number;
  idpvAreas: number;
  idpvAreasMesas: number;
  idpvCortes: number;
  idpvUsuarios: number;
  idpvUsuariosCajero: number;
  idpvUsuariosMesero: number;
  idpvVentas: number;
  menores: number;
  nombre: string;
  propina: number;
  total: number;
  habitacion: string;
}

export interface Kitchen {
  idpvCocinas: number;
  idpvImpresoras: number;
  nombre: string;
}

export interface Printer {
  idgeneralImpresoras: number;
  nombre: string;
}

export interface Command {
  cantidad: number;
  comando: string;
  cuenta: number;
  estatus: number;
  fecha: string;
  folio: number;
  hora: string;
  idpvCocinas: number;
  idpvPlatillos: number;
  idpvVentas: number;
  idpvComandas: number;
  modificadores: null | string;
  notas: string;
  platillo: string;
  precio: number;
  terminos: null | string;
  tiempo: number;
  total: number;
}

export interface PaymentOption {
  hotel: boolean;
  idgeneralFormasDePago: number;
  idpvFormaPago: number;
  nombre: string;
  efectivo: boolean;
}
