import { Pipe, PipeTransform } from '@angular/core';

export interface Grouped<T> {
  key: string;
  value: T[];
}

@Pipe({
  standalone: true,
  name: 'groupBy'
})
export class GroupByPipe implements PipeTransform {
  transform<T extends Record<string, any>>(
    value: T[] | null | undefined,
    key: keyof T & string
  ): Grouped<T>[] {
    if (!value || !Array.isArray(value)) {
      return [];
    }

    const grouped = value.reduce((acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    return Object.keys(grouped).map(k => ({ key: k, value: grouped[k] }));
  }
}
