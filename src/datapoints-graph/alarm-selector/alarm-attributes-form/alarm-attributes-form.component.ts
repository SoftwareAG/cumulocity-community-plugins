import { Component, forwardRef } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { take } from 'rxjs/operators';
import { ALARM_EVENT_TIMELINE_TYPES } from '../alarm-selector-modal/alarm-selector-modal.model';

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
  implements ControlValueAccessor, Validator
{
  ALARM_EVENT_TIMELINE_TYPES = ALARM_EVENT_TIMELINE_TYPES;
  formGroup: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group({
      color: [],
      __active: [],
      __target: [],
      label: [],
      filters: this.formBuilder.group({ type: [] }),
      timelineType: [],
    });
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
}
