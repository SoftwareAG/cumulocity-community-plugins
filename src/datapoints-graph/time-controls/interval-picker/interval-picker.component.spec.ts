import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntervalPickerComponent } from './interval-picker.component';
import { CommonModule, FormsModule } from '@c8y/ngx-components';

describe('IntervalPickerComponent', () => {
  let component: IntervalPickerComponent;
  let fixture: ComponentFixture<IntervalPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule.forRoot(), FormsModule],
      declarations: [IntervalPickerComponent],
      providers: [],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(IntervalPickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit current interval if it\'s different from "custom" for the purpose of updating time range', () => {
    // given
    component.interval = 'hours';
    spyOn(component.intervalChange, 'emit');
    // when
    fixture.detectChanges();
    // then
    expect(component.intervalChange.emit).toHaveBeenCalledWith('hours');
  });

  it('should not emit current interval if it\'s "custom" ', () => {
    // given
    component.interval = 'custom';
    spyOn(component.intervalChange, 'emit');
    // when
    fixture.detectChanges();
    // then
    expect(component.intervalChange.emit).not.toHaveBeenCalled();
  });
});
