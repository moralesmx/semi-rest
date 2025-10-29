import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: 'range'
})
export class RangePipe implements PipeTransform {
  transform(value: any[], size: number, start: number = 0): number[] {
    const result: number[] = [];
    for (let i = start; i < size; i++) {
      result.push(i);
    }
    return result;
  }
}
