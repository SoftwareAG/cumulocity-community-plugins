import { Component, forwardRef } from '@angular/core';
import { FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

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
export class AlarmSelectorListItemComponent {
  formGroup: FormGroup;
}
