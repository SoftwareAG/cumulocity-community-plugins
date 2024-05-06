import { AlarmEventAttributesFormComponent } from './alarm-event-attributes-form.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule, FormsModule } from '@c8y/ngx-components';
import { ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_SEVERITY_VALUES } from '../alarm-event-selector.model';
import { SeverityIconPipe } from '../pipes/severity-icon.pipe';

describe('AlarmEventAttributesFormComponent', () => {
  let component: AlarmEventAttributesFormComponent;
  let fixture: ComponentFixture<AlarmEventAttributesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule.forRoot(), FormsModule, ReactiveFormsModule],
      declarations: [AlarmEventAttributesFormComponent, SeverityIconPipe],
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
        severities: DEFAULT_SEVERITY_VALUES,
      });
    });
  });

  it('form should be valid if at least one severity is selected', () => {
    // given
    component.timelineType = 'ALARM';
    fixture.detectChanges();
    // when
    component.formGroup.patchValue({
      filters: { type: 'critical' },
      severities: {
        CRITICAL: true,
        MAJOR: false,
        MINOR: false,
        WARNING: false,
      },
    });
    // then
    expect(component.formGroup.invalid).toEqual(false);
  });

  it('form should be invalid if at no severity is selected', () => {
    // given
    component.timelineType = 'ALARM';
    fixture.detectChanges();
    // when
    component.formGroup.patchValue({
      filters: { type: 'critical' },
      severities: {
        CRITICAL: false,
        MAJOR: false,
        MINOR: false,
        WARNING: false,
      },
    });
    // then
    expect(component.formGroup.invalid).toEqual(true);
  });
});
