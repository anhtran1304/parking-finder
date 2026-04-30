import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="layout">
      <header class="header">
        <h1>Parking Finder</h1>
        <p>Fast search and booking with Redis + PostGIS</p>
      </header>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .layout {
        width: min(1180px, 92vw);
        margin: 2rem auto;
        display: grid;
        gap: 1.25rem;
      }

      .header {
        border: 1px solid var(--border);
        background: linear-gradient(135deg, #ffffff, #e8f3eb);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
      }

      h1 {
        margin: 0;
        font-size: 1.9rem;
      }

      p {
        margin: 0.35rem 0 0;
        color: var(--muted);
      }
    `
  ]
})
export class AppComponent {}
