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
import { TimelineType } from '../alarm-event-selector.model';

@Component({
  selector: 'c8y-alarm-event-attributes-form',
  templateUrl: './alarm-event-attributes-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AlarmEventAttributesFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlarmEventAttributesFormComponent),
      multi: true,
    },
  ],
})
export class AlarmEventAttributesFormComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() timelineType: TimelineType;
  formGroup: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      label: '',
      filters: this.formBuilder.group({ type: ['', [Validators.required]] }),
      timelineType: '',
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
