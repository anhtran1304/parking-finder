import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAppIcons } from '../../shared/icons/icon-registry';
import { BookingActionsComponent } from './booking-actions.component';

describe('BookingActionsComponent', () => {
  let fixture: ComponentFixture<BookingActionsComponent>;
  let component: BookingActionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingActionsComponent],
      providers: [provideAppIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingActionsComponent);
    component = fixture.componentInstance;
  });

  it('should disable the cancel action while cancellation is in progress', () => {
    component.status = 'ACTIVE';
    component.cancelLoading = true;
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector('.pf-button--danger-soft') as HTMLButtonElement;
    expect(cancelButton.disabled).toBeTrue();
    expect(cancelButton.textContent).toContain('Cancelling…');
  });
});
