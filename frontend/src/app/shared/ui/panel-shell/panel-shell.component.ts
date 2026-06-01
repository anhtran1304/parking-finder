import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-panel-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside
      class="panel-shell"
      [class.panel-shell--glass]="surface === 'glass'"
      [attr.aria-label]="ariaLabel"
    >
      <ng-content select="[panelHeader]"></ng-content>
      <ng-content select="[panelMedia]"></ng-content>

      <div
        class="panel-shell__body"
        [class.panel-shell__body--hidden-scrollbar]="scrollbar === 'hidden'"
      >
        <ng-content select="[panelBody]"></ng-content>
      </div>

      <ng-content select="[panelFooter]"></ng-content>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .panel-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--surface-panel);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--border-panel);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-float);
      }

      .panel-shell--glass {
        background: var(--surface-panel-glass);
      }

      .panel-shell__body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: var(--color-border-default) transparent;
      }

      .panel-shell__body--hidden-scrollbar {
        scrollbar-width: none;
      }

      .panel-shell__body--hidden-scrollbar::-webkit-scrollbar {
        display: none;
      }

      @media (max-width: 767px) {
        .panel-shell {
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }
      }
    `,
  ],
})
export class PanelShellComponent {
  @Input() ariaLabel = 'Panel';
  @Input() surface: 'solid' | 'glass' = 'solid';
  @Input() scrollbar: 'thin' | 'hidden' = 'thin';
}
