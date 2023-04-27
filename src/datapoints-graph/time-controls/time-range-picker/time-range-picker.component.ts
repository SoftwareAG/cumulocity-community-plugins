import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { DateTimeContext, gettext } from '@c8y/ngx-components';

@Component({
  selector: 'c8y-time-range-picker',
  templateUrl: './time-range-picker.component.html',
})
export class TimeRangePickerComponent implements OnChanges {
  @Input() timeRange: DateTimeContext;
  @Output() timeRangeChange = new EventEmitter<DateTimeContext>();
  @Input() disabled = false;

  form: FormGroup;
  fields: FormlyFieldConfig[];
  model: {
    fromDate: string;
    toDate: string;
  };

  ngOnChanges() {
    this.initForm(this.timeRange);
  }

  applyDatetimeContext() {
    this.update([
      new Date(this.form.value.fromDate),
      new Date(this.form.value.toDate),
    ]);
  }

  private update(dateRange: DateTimeContext) {
    this.timeRangeChange.emit(dateRange);
  }

  private initForm(initialValue: DateTimeContext) {
    this.form = new FormGroup({});
    this.fields = [
      {
        type: 'date-time',
        key: 'fromDate',
        templateOptions: {
          label: gettext('From`date`'),
        },
        expressionProperties: {
          'templateOptions.maxDate': (model: any) => model?.toDate,
        },
      },
      {
        type: 'date-time',
        key: 'toDate',
        templateOptions: {
          label: gettext('To`date`'),
        },
        expressionProperties: {
          'templateOptions.minDate': (model: any) => model?.fromDate,
        },
      },
    ];
    this.model = {
      fromDate: initialValue[0]?.toISOString(),
      toDate: initialValue[1]?.toISOString(),
    };

    if (this.disabled) {
      queueMicrotask(() => {
        this.form.disable();
      });
    }
  }
}
