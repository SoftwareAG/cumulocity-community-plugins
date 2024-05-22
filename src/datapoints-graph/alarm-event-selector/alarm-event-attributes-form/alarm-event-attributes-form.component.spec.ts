import { AlarmEventAttributesFormComponent } from './alarm-event-attributes-form.component';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { CommonModule, FormsModule } from '@c8y/ngx-components';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

describe('AlarmEventAttributesFormComponent', () => {
  let component: AlarmEventAttributesFormComponent;
  let fixture: ComponentFixture<AlarmEventAttributesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule.forRoot(), FormsModule, ReactiveFormsModule],
      declarations: [AlarmEventAttributesFormComponent],
      providers: [],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(AlarmEventAttributesFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onInit', () => {
    it('should init form for event', () => {
      // given
      component.timelineType = 'EVENT';
      // when
      fixture.detectChanges();
      // then
      expect(component.formGroup.value).toEqual({
        label: '',
        filters: { type: '' },
        timelineType: '',
      });
    });

    it('should init form for alarm', () => {
      // given
      component.timelineType = 'ALARM';
      // when
      fixture.detectChanges();
      // then
      expect(component.formGroup.value).toEqual({
        label: '',
        filters: { type: '' },
        timelineType: '',
      });
    });
  });

  it('reset', fakeAsync(() => {
    // given
    component.ngOnInit();
    fixture.detectChanges();
    component.formGroup.patchValue({
      label: 'test',
      filters: { type: 'test' },
      timelineType: 'ALARM',
    });
    // when
    component.reset();
    tick(1000);
    // then
    expect(component.formGroup.value).toEqual({
      label: '',
      filters: { type: '' },
      timelineType: 'ALARM',
    });
    expect(component.formGroup.controls.label.touched).toBe(false);
    expect(
      (component.formGroup.controls['filters'] as FormGroup).controls.type
        .touched
    ).toBe(false);

    component.formGroups.forEach((f) => {
      expect(f.hasError).toBe(false);
      expect(f.errors).toBe(null);
    });
  }));
});
