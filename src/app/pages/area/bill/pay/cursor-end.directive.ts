import { Directive, HostListener } from '@angular/core';

@Directive({
  standalone: true,
  selector: 'input[appCursorEnd]'
})
export class CursorEndDirective {
  @HostListener('click', ['$event']) cursorEnd(event: Event) {
    const input = event.target as HTMLInputElement;
    input.selectionStart = input.selectionEnd = input.value.length;
  }
}
