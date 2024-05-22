import {
  Component,
  forwardRef,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { take } from 'rxjs/operators';
import { TimelineType } from '../alarm-event-selector.model';
import { FormGroupComponent } from '@c8y/ngx-components';

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

  @ViewChildren(FormGroupComponent)
  formGroups: QueryList<FormGroupComponent>;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      label: ['', [Validators.required]],
      filters: this.formBuilder.group({ type: ['', [Validators.required]] }),
      timelineType: '',
    });
  }

  reset() {
    // resetting values to initial state
    this.formGroup.patchValue({ label: '', filters: { type: '' } });
    // marking controls as untouched so inputs are not marked as invalid (with red border)
    this.formGroup.controls.label.markAsUntouched();
    (
      this.formGroup.controls['filters'] as FormGroup
    ).controls.type.markAsUntouched();

    // resetting initial state of FormGroupComponent so validation message are not shown
    this.formGroups.forEach((formGroup) => {
      setTimeout(() => {
        formGroup.errors = null;
        formGroup.hasError = false;
      }, (formGroup as any)?.VALIDATION_DEBOUNCE_MS || 1000);
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
