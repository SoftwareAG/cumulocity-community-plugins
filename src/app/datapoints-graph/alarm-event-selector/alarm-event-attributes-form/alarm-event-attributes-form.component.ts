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
  Validators,
} from '@angular/forms';
import { take } from 'rxjs/operators';
import { SelectedDatapoint, TimelineType } from '../alarm-event-selector.model';
import { IIdentified } from '@c8y/client';
import { KPIDetails } from '@c8y/ngx-components/datapoint-selector';

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
  @Input() target: IIdentified;
  @Input() datapoints: KPIDetails[] = [];
  formGroup: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      label: ['', [Validators.required]],
      filters: this.formBuilder.group({ type: ['', [Validators.required]] }),
      timelineType: '',
      selectedDatapoint: [{}, []],
    });
    this.listKpis();
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

  changeDatapointSelection(selectedDatapoint: SelectedDatapoint) {
    this.formGroup.patchValue({ selectedDatapoint });
  }

  trackByFn(_index: number, item: KPIDetails) {
    return `${item.fragment}-${item.series}-${item.__target?.id}`;
  }

  private listKpis() {
    if (this.target && this.target.id) {
      this.datapoints = this.datapoints.filter(
        (dp) => dp.__target?.id === this.target.id
      );
    }
  }
}
