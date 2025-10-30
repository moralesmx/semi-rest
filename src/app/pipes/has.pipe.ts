import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'has',
  pure: true
})
export class HasPipe implements PipeTransform {
  public transform<T extends Record<string, any>>(
    list: T[] | null | undefined,
    property: keyof T & string
  ): T[] {
    if (!list || !Array.isArray(list)) {
      return [];
    }
    return list.filter(item => !!item[property]);
  }
}

@Pipe({
  standalone: true,
  name: 'hasnot',
  pure: true
})
export class HasNotPipe implements PipeTransform {
  public transform<T extends Record<string, any>>(
    list: T[] | null | undefined,
    property: keyof T & string
  ): T[] {
    if (!list || !Array.isArray(list)) {
      return [];
    }
    return list.filter(item => !item[property]);
  }
}
