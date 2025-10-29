import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  transform(value: any[], key: string, reverse: boolean = false): any[] {
    if (!value || !Array.isArray(value)) {
      return value;
    }

    const sorted = [...value].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) return 0;
      if (aVal < bVal) return reverse ? 1 : -1;
      return reverse ? -1 : 1;
    });

    return sorted;
  }
}
