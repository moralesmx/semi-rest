import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'has',
  pure: true
})
export class HasPipe implements PipeTransform {
  public transform(list: any[], property: string): any[] {
    return list.filter(item => !!item[property]);
  }
}

@Pipe({
  standalone: true,
  name: 'hasnot',
  pure: true
})
export class HasNotPipe implements PipeTransform {
  public transform(list: any[], property: string): any[] {
    return list.filter(item => !item[property]);
  }
}
