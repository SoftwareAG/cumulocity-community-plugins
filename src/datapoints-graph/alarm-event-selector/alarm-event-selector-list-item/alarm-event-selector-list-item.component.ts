import {
  AfterViewInit,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
  ViewChild,
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
import { ListItemComponent } from '@c8y/ngx-components';
import { Observable, Subject } from 'rxjs';

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
  implements ControlValueAccessor, Validator, AfterViewInit, OnDestroy
{
  @Input() timelineType: TimelineType;
  @Input() highlightText: string;
  @Input() showAddRemoveButton = true;
  @Input() isSelected = false;
  @Input() optionToRemove = false;
  @Input() showActiveToggle = false;
  @Input() isCollapsed = true;
  @Input() showAttributesForm = false;

  @Output() added = new EventEmitter<AlarmOrEvent>();
  @Output() removed = new EventEmitter<AlarmOrEvent>();

  @ViewChild('li', { static: true }) listItem: ListItemComponent;

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

  ngAfterViewInit() {
    queueMicrotask(() => {
      this.listItem.collapsed = this.isCollapsed;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
