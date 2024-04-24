import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
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
import { Observable } from 'rxjs/internal/Observable';
import { AlarmDetails } from '../alarm-selector-modal/alarm-selector-modal.model';
import { map, startWith, take } from 'rxjs/operators';

@Component({
  selector: 'c8y-alarm-selector-list-item',
  templateUrl: './alarm-selector-list-item.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AlarmSelectorListItemComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlarmSelectorListItemComponent),
      multi: true,
    },
  ],
})
export class AlarmSelectorListItemComponent
  implements ControlValueAccessor, Validator
{
  @Input() highlightText: string;
  @Input() showAddRemoveButton = true;
  @Input() isSelected = false;
  @Input() optionToRemove = false;
  @Input() showActiveToggle = false;
  @Input() isCollapsed = true;

  @Output() added = new EventEmitter<AlarmDetails>();
  @Output() removed = new EventEmitter<AlarmDetails>();

  formGroup: FormGroup;
  isValid$: Observable<boolean>;

  constructor(private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group({
      details: [],
      color: [],
      __active: [],
      __target: [],
    });
    this.isValid$ = this.formGroup.statusChanges.pipe(
      map((status) => status === 'VALID'),
      startWith(this.formGroup.valid)
    );
  }

  validate(_control: AbstractControl): ValidationErrors {
    return this.formGroup?.valid ? null : { formInvalid: {} };
  }

  writeValue(obj: any): void {
    this.formGroup.patchValue({ ...obj, details: obj });
  }

  registerOnChange(fn: any): void {
    this.formGroup.valueChanges
      .pipe(map((tmp) => this.transformFormValue(tmp)))
      .subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.formGroup.valueChanges.pipe(take(1)).subscribe(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.formGroup.disable() : this.formGroup.enable();
  }

  collapse() {
    this.isCollapsed = !this.isCollapsed;
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
