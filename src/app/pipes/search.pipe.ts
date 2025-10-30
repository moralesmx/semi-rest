import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'search',
  pure: true
})

export class SearchPipe implements PipeTransform {
  public transform<T extends Record<string, any>>(
    list: T[] | null | undefined,
    ...ors: [keyof T & string, string][][]
  ): T[] {
    if (!list || !Array.isArray(list)) {
      return [];
    }
    if (ors.length === 0) {
      return list;
    }
    return list.filter(item => {
      return ors.some(ands => {
        return ands.every(([property, text]) => {
          const value = item[property];
          if (value == null) return false;
          return String(value).toLowerCase().includes(text.toLowerCase());
        });
      });
    });
  }
}
