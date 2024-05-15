import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlarmOrEvent, TimelineType } from '../alarm-event-selector.model';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { IIdentified } from '@c8y/client';
import { ColorService } from '@c8y/ngx-components';

@Component({
  selector: 'c8y-custom-alarm-event-form',
  templateUrl: './custom-alarm-event-form.component.html',
})
export class CustomAlarmEventFormComponent implements OnInit, OnDestroy {
  @Input() timelineType: TimelineType;
  @Input() target: IIdentified;
  @Output() added = new EventEmitter<AlarmOrEvent>();
  @Output() cancel = new EventEmitter<void>();

  formGroup: FormGroup;
  valid$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(private formBuilder: FormBuilder, private color: ColorService) {
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

  async ngOnInit() {
    const color = await this.color.generateColor(this.target.name);

    this.formGroup.patchValue({
      color,
      __target: this.target,
      details: { timelineType: this.timelineType },
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  add() {
    if (this.formGroup.valid) {
      const formValue = this.transformFormValue(this.formGroup.value);
      this.added.emit(formValue);
    }
  }

  private transformFormValue(formValue: any) {
    const obj = Object.assign({}, formValue.details || {}, formValue);
    delete obj.details;
    return obj;
  }
}
