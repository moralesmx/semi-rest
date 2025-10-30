import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  transform<T extends Record<string, any>>(
    value: T[] | null | undefined,
    key: keyof T & string,
    reverse: boolean = false
  ): T[] {
    if (!value || !Array.isArray(value)) {
      return [];
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
