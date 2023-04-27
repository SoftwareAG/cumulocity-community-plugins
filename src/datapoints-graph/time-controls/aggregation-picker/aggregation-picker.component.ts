import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AGGREGATIONS } from '../../model';
import { aggregationType } from '@c8y/client';

@Component({
  selector: 'c8y-aggregation-picker',
  templateUrl: './aggregation-picker.component.html'
})
export class AggregationPickerComponent {
  AGGREGATIONS = AGGREGATIONS;
  @Input() aggregation: aggregationType;
  @Input() disabledAggregations: Partial<Record<aggregationType, boolean>> = {};
  @Input() disabled = false;
  @Output() aggregationChange = new EventEmitter<aggregationType>();
}
