import { Directive, HostListener } from '@angular/core';

@Directive({ selector: '[appCursorEnd]' })
export class CursorEndDirective {
  @HostListener('click', ['$event']) private cursorEnd(event: MouseEvent) {
    const input: HTMLInputElement = event.target as HTMLInputElement;
    input.selectionStart = input.selectionEnd = input.value.length;
  }
}
