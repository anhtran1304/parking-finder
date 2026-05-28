import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ParkingMapComponent } from './parking-map.component';

describe('ParkingMapComponent', () => {
  let component: ParkingMapComponent;
  let fixture: ComponentFixture<ParkingMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingMapComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                nearby: []
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParkingMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark status as full when no slots left', () => {
    expect((component as any).markerStatus(0)).toBe('full');
  });
});
