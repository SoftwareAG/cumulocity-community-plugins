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
} from '@angular/forms';
import { WidgetConfigComponent } from '@c8y/ngx-components/context-dashboard';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AlarmEventSelectorService } from '../alarm-event-selector.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  AlarmEventSelectorModalOptions,
  AlarmOrEvent,
  TimelineType,
} from '../alarm-event-selector-modal/alarm-event-selector-modal.model';
import { gettext } from '@c8y/ngx-components';

@Component({
  selector: 'c8y-alarm-event-selection-list',
  templateUrl: './alarm-event-selection-list.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => AlarmEventSelectionListComponent),
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlarmEventSelectionListComponent),
      multi: true,
    },
  ],
})
export class AlarmEventSelectionListComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() listType: TimelineType = 'ALARM';
  @Input() allowDragAndDrop = true;
  @Input() config: Partial<AlarmEventSelectorModalOptions> = {};
  @Input() defaultFormOptions: Partial<AlarmEventSelectorModalOptions> = {};
  @Input() resolveContext = true;
  @Input() listTitle = '';
  formArray: FormArray;
  timelineTypeTexts: ReturnType<AlarmEventSelectorService['timelineTypeTexts']>;

  @Output() isValid: Observable<boolean>;

  constructor(
    private alarmEventSelectService: AlarmEventSelectorService,
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
    this.timelineTypeTexts = this.alarmEventSelectService.timelineTypeTexts(
      this.listType
    );
    const context = this.widgetComponent?.context;
    if (context?.id && this.resolveContext) {
      const { name, id, c8y_IsDevice } = context;
      this.config.contextAsset = { name, id, c8y_IsDevice };
    }
  }

  writeValue(val: AlarmOrEvent[]): void {
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
    this.alarmEventSelectService
      .selectItems({
        ...(this.config || {}),
        allowChangingContext,
        selectType: this.listType,
        selectedItems: this.transformValue(this.formArray.value),
        allowSearch: !this.config?.contextAsset,
        title: this.timelineTypeTexts.selectorTitle,
        saveButtonLabel: this.timelineTypeTexts.addButtonLabel,
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

  drop(event: CdkDragDrop<AlarmOrEvent[]>) {
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
