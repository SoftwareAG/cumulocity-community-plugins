import { Component, forwardRef, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { take } from 'rxjs/operators';
import {
  DEFAULT_SEVERITY_VALUES,
  SEVERITY_LABELS,
  TimelineType,
} from '../alarm-event-selector-modal/alarm-event-selector-modal.model';

@Component({
  selector: 'c8y-alarm-attributes-form',
  templateUrl: './alarm-attributes-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AlarmAttributesFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlarmAttributesFormComponent),
      multi: true,
    },
  ],
})
export class AlarmAttributesFormComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() timelineType: TimelineType;
  formGroup: FormGroup;
  severityList = Object.keys(SEVERITY_LABELS);
  readonly SEVERITY_LABELS = SEVERITY_LABELS;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      label: '',
      filters: this.formBuilder.group({ type: ['', [Validators.required]] }),
      timelineType: '',
    });
    if (this.timelineType === 'ALARM') {
      this.formGroup.addControl(
        'severities',
        this.formBuilder.group(DEFAULT_SEVERITY_VALUES, {
          validators: this.minSelectedCheckboxes(1),
        })
      );
    }
  }

  validate(_control: AbstractControl): ValidationErrors {
    return this.formGroup?.valid ? null : { formInvalid: {} };
  }

  writeValue(obj: any): void {
    this.formGroup.patchValue(obj);
  }

  registerOnChange(fn: any): void {
    this.formGroup.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.formGroup.valueChanges.pipe(take(1)).subscribe(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.formGroup.disable() : this.formGroup.enable();
  }

  private minSelectedCheckboxes(min = 1): ValidatorFn {
    const validator: ValidatorFn = (formGroup: FormGroup) => {
      const totalSelected = Object.values(formGroup.controls).reduce(
        (prev, next) => (next.value ? prev + next.value : prev),
        0
      );

      return totalSelected >= min ? null : { required: true };
    };

    return validator;
  }
}
