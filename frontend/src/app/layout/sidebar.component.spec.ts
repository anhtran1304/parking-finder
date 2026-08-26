import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NearbyParkingResponse } from '../models/parking.model';
import { ParkingCardComponent } from '../shared/components/parking-card.component';
import { provideAppIcons } from '../shared/icons/icon-registry';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent freshness clock', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  const parking = (id: number): NearbyParkingResponse => ({
    id,
    name: `Parking ${id}`,
    availableSlots: 5,
    totalSlots: 10,
    hourlyRate: 2,
    lat: 10.77,
    lng: 106.7,
    distanceMeters: 200,
    updatedAt: '2026-08-26T09:00:00Z',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideAppIcons()],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    component.parkings = [parking(1), parking(2)];
  });

  it('shares one one-second clock across every parking card', fakeAsync(() => {
    const intervalSpy = spyOn(window, 'setInterval').and.callThrough();
    fixture.detectChanges();
    const initialNow = component.nowMs();

    tick(1000);
    fixture.detectChanges();

    const cards = fixture.debugElement
      .queryAll(By.directive(ParkingCardComponent))
      .map((debugElement) => debugElement.componentInstance as ParkingCardComponent);
    expect(intervalSpy).toHaveBeenCalledTimes(1);
    expect(component.nowMs()).toBe(initialNow + 1000);
    expect(cards.map((card) => card.nowMs)).toEqual([component.nowMs(), component.nowMs()]);
    expect(cards.map((card) => card.updatedAt)).toEqual(component.parkings.map((item) => item.updatedAt));

    fixture.destroy();
  }));

  it('stops the freshness clock when destroyed', fakeAsync(() => {
    fixture.detectChanges();
    tick(1000);
    const stoppedAt = component.nowMs();

    fixture.destroy();
    tick(2000);

    expect(component.nowMs()).toBe(stoppedAt);
  }));
});
