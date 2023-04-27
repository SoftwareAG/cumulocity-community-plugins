import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Interval, INTERVALS } from '../../model';

@Component({
  selector: 'c8y-interval-picker',
  templateUrl: './interval-picker.component.html',
})
export class IntervalPickerComponent implements OnInit {
  INTERVALS = INTERVALS;
  @Input() interval: Interval['id'];
  @Input() disabled = false;
  @Output() intervalChange = new EventEmitter<Interval['id']>();

  ngOnInit() {
    if (this.interval !== 'custom') {
      this.intervalChange.emit(this.interval);
    }
  }
}
