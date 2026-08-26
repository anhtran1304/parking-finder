import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAppIcons } from '../icons/icon-registry';
import { ParkingCardComponent } from './parking-card.component';

describe('ParkingCardComponent freshness', () => {
  let fixture: ComponentFixture<ParkingCardComponent>;
  let component: ParkingCardComponent;

  const nowMs = Date.UTC(2026, 7, 26, 10, 0, 0);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingCardComponent],
      providers: [provideAppIcons()],
    }).compileComponents();
    fixture = TestBed.createComponent(ParkingCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('updatedAt', new Date(nowMs).toISOString());
    fixture.componentRef.setInput('nowMs', nowMs);
  });

  [
    { ageMs: -10_000, expected: 'Updated just now' },
    { ageMs: 0, expected: 'Updated just now' },
    { ageMs: 4_999, expected: 'Updated just now' },
    { ageMs: 5_000, expected: 'Updated 5s ago' },
    { ageMs: 59_999, expected: 'Updated 59s ago' },
    { ageMs: 60_000, expected: 'Updated 1m ago' },
    { ageMs: 59 * 60_000, expected: 'Updated 59m ago' },
    { ageMs: 60 * 60_000, expected: 'Updated 1h ago' },
    { ageMs: 23 * 60 * 60_000, expected: 'Updated 23h ago' },
    { ageMs: 24 * 60 * 60_000, expected: 'Updated 1d ago' },
    { ageMs: 2 * 24 * 60 * 60_000 + 12 * 60 * 60_000, expected: 'Updated 2d ago' },
  ].forEach(({ ageMs, expected }) => {
    it(`formats ${ageMs}ms of age as "${expected}"`, () => {
      component.updatedAt = new Date(nowMs - ageMs).toISOString();

      expect(component.freshnessLabel).toBe(expected);
    });
  });

  it('falls back safely for an invalid timestamp', () => {
    component.updatedAt = 'not-a-timestamp';

    expect(component.freshnessLabel).toBe('Update time unavailable');
    expect(component.freshnessTitle).toBe('Availability update time unavailable');
  });

  it('updates the rendered label when the shared clock or timestamp changes', () => {
    fixture.detectChanges();
    const freshness = () => fixture.debugElement.query(By.css('.card__freshness')).nativeElement;
    expect(freshness().textContent.trim()).toBe('Updated just now');

    fixture.componentRef.setInput('nowMs', nowMs + 12_000);
    fixture.detectChanges();
    expect(freshness().textContent.trim()).toBe('Updated 12s ago');

    fixture.componentRef.setInput('updatedAt', new Date(nowMs + 10_000).toISOString());
    fixture.detectChanges();
    expect(freshness().textContent.trim()).toBe('Updated just now');
  });

  it('exposes the absolute update time as tooltip and accessible text', () => {
    fixture.detectChanges();
    const freshness: HTMLElement = fixture.debugElement.query(By.css('.card__freshness')).nativeElement;

    expect(freshness.getAttribute('title')).toContain('Last updated');
    expect(freshness.getAttribute('aria-label')).toBe(freshness.getAttribute('title'));
  });
});
