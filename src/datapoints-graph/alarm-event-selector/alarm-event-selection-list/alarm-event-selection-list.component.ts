import { Component, forwardRef, Input, OnInit, Optional } from '@angular/core';
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
import { map, take } from 'rxjs/operators';
import { AlarmEventSelectorService } from '../alarm-event-selector.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  AlarmEventSelectorModalOptions,
  AlarmOrEvent,
  TimelineType,
  TimelineTypeTexts,
} from '../alarm-event-selector.model';

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
  @Input() timelineType: TimelineType = 'ALARM';
  @Input() config: Partial<AlarmEventSelectorModalOptions> = {};

  formArray: FormArray;
  timelineTypeTexts: TimelineTypeTexts;

  constructor(
    private alarmEventSelectService: AlarmEventSelectorService,
    private formBuilder: FormBuilder,
    @Optional() private widgetComponent: WidgetConfigComponent
  ) {
    this.formArray = this.formBuilder.array([]);
  }

  ngOnInit(): void {
    this.timelineTypeTexts = this.alarmEventSelectService.timelineTypeTexts(
      this.timelineType
    );
    const context = this.widgetComponent?.context;
    if (context?.id) {
      const { name, id, c8y_IsDevice } = context;
      this.config.contextAsset = { name, id, c8y_IsDevice };
    }
  }

  registerOnTouched(fn: any): void {
    this.formArray.valueChanges.pipe(take(1)).subscribe(fn);
  }

  validate(_control: AbstractControl): ValidationErrors {
    return this.formArray.valid ? null : { formInvalid: {} };
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
        selectType: this.timelineType,
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
