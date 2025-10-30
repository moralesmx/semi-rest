import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'range'
})
export class RangePipe implements PipeTransform {
  transform(_value: unknown, size: number, start: number = 0): number[] {
    const result: number[] = [];
    for (let i = start; i < size; i++) {
      result.push(i);
    }
    return result;
  }
}
