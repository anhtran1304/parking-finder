import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="search">
      <app-icon class="search__icon" name="search" [size]="16" [strokeWidth]="2" />
      <input
        class="search__input"
        type="text"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
      />
    </div>
  `,
  styles: [
    `
      .search {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search__icon {
        position: absolute;
        left: 14px;
        color: var(--color-text-disabled);
        pointer-events: none;
      }

      .search__input {
        width: 100%;
        padding: 10px 14px 10px 38px;
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-family: var(--font-sans);
        color: var(--color-text-primary);
        background: var(--overlay-subtle);
        outline: none;
        transition: all var(--duration-fast) ease;
      }

      .search__input::placeholder {
        color: var(--color-text-disabled);
      }

      .search__input:focus {
        background: var(--overlay-light);
        box-shadow: var(--shadow-primary-focus);
      }
    `,
  ],
})
export class SearchBarComponent {
  @Input() placeholder = 'Search parking...';
  @Input() value = '';
  @Output() searchChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchChange.emit(val);
  }
}
