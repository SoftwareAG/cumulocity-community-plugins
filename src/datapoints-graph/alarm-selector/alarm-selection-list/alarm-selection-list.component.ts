import {
  Component,
  forwardRef,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms';
import { WidgetConfigComponent } from '@c8y/ngx-components/context-dashboard';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  AlarmDetails,
  AlarmSelectorModalOptions,
} from '../alarm-selector-modal/alarm-selector-modal.model';
import { AlarmSelectorService } from '../alarm-selector.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'c8y-alarm-selection-list',
  templateUrl: './alarm-selection-list.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => AlarmSelectionListComponent),
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlarmSelectionListComponent),
      multi: true,
    },
  ],
})
export class AlarmSelectionListComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() allowDragAndDrop = true;
  @Input() config: Partial<AlarmSelectorModalOptions> = {};
  @Input() defaultFormOptions: Partial<AlarmSelectorModalOptions> = {};
  @Input() resolveContext = true;
  @Input() listTitle = '';
  formArray: FormArray;

  @Output() isValid: Observable<boolean>;

  constructor(
    private alarmSelector: AlarmSelectorService,
    private formBuilder: FormBuilder,
    @Optional() private widgetComponent: WidgetConfigComponent
  ) {
    this.formArray = this.formBuilder.array([]);
    this.isValid = this.formArray.statusChanges.pipe(
      map((status) => status === 'VALID')
    );
  }

  registerOnTouched(fn: any): void {
    this.formArray.valueChanges.pipe(take(1)).subscribe(fn);
  }

  validate(_control: AbstractControl): ValidationErrors {
    return this.formArray.valid ? null : { formInvalid: {} };
  }

  ngOnInit(): void {
    const context = this.widgetComponent?.context;
    if (context?.id && this.resolveContext) {
      const { name, id, c8y_IsDevice } = context;
      this.config.contextAsset = { name, id, c8y_IsDevice };
    }
  }

  writeValue(val: AlarmDetails[]): void {
    this.formArray.clear();
    if (val?.length) {
      val.forEach((val) => {
        const formgroup = this.formBuilder.group({ details: [] });
        formgroup.patchValue({ details: val });
        this.formArray.push(formgroup);
      });
    }
  }

  registerOnChange(fn: any): void {
    this.formArray.valueChanges
      .pipe(map((res) => this.transformValue(res)))
      .subscribe(fn);
  }

  add() {
    const allowChangingContext =
      !this.widgetComponent?.isDeviceTypeDashboard &&
      this.config?.allowChangingContext !== false;
    this.alarmSelector
      .selectAlarms({
        ...(this.config || {}),
        allowChangingContext,
        selectedAlarms: this.transformValue(this.formArray.value),
        allowSearch: !this.config?.contextAsset,
      })
      .then(
        (result) => {
          this.writeValue(result);
        },
        () => {
          // nothing to do, modal was closed
        }
      );
  }

  onItemRemoved(index: number) {
    this.formArray.removeAt(index);
  }

  drop(event: CdkDragDrop<AlarmDetails[]>) {
    const currentSorting = this.formArray.value;
    moveItemInArray(currentSorting, event.previousIndex, event.currentIndex);
    this.formArray.setValue(currentSorting);
  }

  private transformValue(formArrayValue: any[]) {
    if (!formArrayValue) {
      return [];
    }
    return formArrayValue.map((tmp) =>
      Object.assign({}, ...Object.values(tmp))
    );
  }
}
