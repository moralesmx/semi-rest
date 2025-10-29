import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: 'groupBy'
})
export class GroupByPipe implements PipeTransform {
  transform(value: any[], key: string): any[] {
    if (!value || !Array.isArray(value)) {
      return value;
    }

    const grouped = value.reduce((acc, item) => {
      const groupKey = item[key];
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.keys(grouped).map(k => ({ key: k, value: grouped[k] }));
  }
}
