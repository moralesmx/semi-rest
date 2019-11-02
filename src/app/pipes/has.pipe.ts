import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'has',
  pure: true
})
export class HasPipe implements PipeTransform {
  public transform(list: any[], property: string): any[] {
    return list.filter(item => !!item[property]);
  }
}

@Pipe({
  name: 'hasnot',
  pure: true
})
export class HasNotPipe implements PipeTransform {
  public transform(list: any[], property: string): any[] {
    return list.filter(item => !item[property]);
  }
}
