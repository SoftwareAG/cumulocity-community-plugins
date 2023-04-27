import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeRangePickerComponent } from './time-range-picker/time-range-picker.component';
import { IntervalPickerComponent } from './interval-picker/interval-picker.component';
import { TimeControlsComponent } from './time-controls.component';
import { AggregationPickerComponent } from './aggregation-picker/aggregation-picker.component';
import { RealtimeControlComponent } from './realtime-control/realtime-control.component';
import { CoreModule, FormsModule } from '@c8y/ngx-components';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  imports: [CommonModule, FormsModule, TooltipModule, CoreModule, BsDropdownModule.forRoot()],
  declarations: [
    TimeRangePickerComponent,
    IntervalPickerComponent,
    TimeControlsComponent,
    AggregationPickerComponent,
    RealtimeControlComponent
  ],
  exports: [TimeControlsComponent]
})
export class TimeControlsModule {}
