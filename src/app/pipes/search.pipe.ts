import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'search',
  pure: true
})

export class SearchPipe implements PipeTransform {
  public transform(list: any[], ...ors: [string, string][][]): any[] {
    if (!Array.isArray(list)) {
      return list;
    }
    return list.filter(item => {
      return ors.some(ands => {
        return ands.every(([property, text]) => {
          return item[property].toString().toLowerCase().includes(text.toLowerCase());
        });
      });
    });
  }
}
