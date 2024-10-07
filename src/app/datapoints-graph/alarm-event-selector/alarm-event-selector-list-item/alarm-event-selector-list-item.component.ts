import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
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
} from '@angular/forms';
import { AlarmOrEvent, TimelineType } from '../alarm-event-selector.model';
import { map, take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { gettext } from '@c8y/ngx-components';
import { KPIDetails } from '@c8y/ngx-components/datapoint-selector';

@Component({
  selector: 'c8y-alarm-event-selector-list-item',
  templateUrl: './alarm-event-selector-list-item.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AlarmEventSelectorListItemComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlarmEventSelectorListItemComponent),
      multi: true,
    },
  ],
})
export class AlarmEventSelectorListItemComponent
  implements ControlValueAccessor, Validator, OnDestroy
{
  @Input() datapoints: KPIDetails | undefined;
  @Input() timelineType: TimelineType | undefined;
  @Input() highlightText: string | undefined;
  @Input() showAddRemoveButton = true;
  @Input() isSelected = false;
  @Input() optionToRemove = false;
  @Input() showActiveToggle = false;
  @Input() allowItemEdit = false;
  colorPickerTitle = this.allowItemEdit ? gettext('Change color') : '';
  @Output() added = new EventEmitter<AlarmOrEvent>();
  @Output() removed = new EventEmitter<AlarmOrEvent>();

  formGroup: FormGroup;
  valid$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group({
      details: [],
      color: [],
      __active: [],
      __target: [],
    });
    this.valid$ = this.formGroup.statusChanges.pipe(
      takeUntil(this.destroy$),
      map((val) => val === 'VALID')
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.formGroup?.valid ? null : { formInvalid: {} };
  }

  writeValue(obj: any): void {
    this.formGroup.patchValue({ ...obj, details: obj });
  }

  registerOnChange(fn: any): void {
    this.formGroup.valueChanges
      .pipe(
        map((tmp) => this.transformFormValue(tmp)),
        takeUntil(this.destroy$)
      )
      .subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.formGroup.valueChanges.pipe(take(1)).subscribe(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.formGroup.disable() : this.formGroup.enable();
  }

  addOrRemoveItem() {
    const value = this.transformFormValue(this.formGroup.value);
    if (this.isSelected) {
      this.removed.emit(value);
    } else {
      this.added.emit(value);
    }
  }

  remove() {
    this.removed.emit(this.transformFormValue(this.formGroup.value));
  }

  private transformFormValue(formValue: any) {
    const obj = Object.assign({}, formValue.details || {}, formValue);
    delete obj.details;
    return obj;
  }
}
