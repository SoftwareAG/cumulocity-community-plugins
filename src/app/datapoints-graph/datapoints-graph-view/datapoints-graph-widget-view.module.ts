import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatapointsGraphWidgetViewComponent } from './datapoints-graph-widget-view.component';
import { TimeControlsModule } from '../time-controls';
import { ChartsComponent } from '../charts';
import { CoreModule } from '@c8y/ngx-components';
import { AlarmsModule } from '@c8y/ngx-components/alarms';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ChartEventsService } from './chart-events.service';
import { ChartAlarmsService } from './chart-alarms.service';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { A11yModule } from '@angular/cdk/a11y';
import { PopoverModule } from 'ngx-bootstrap/popover';

@NgModule({
  imports: [
    A11yModule,
    CommonModule,
    ChartsComponent,
    CoreModule,
    TooltipModule,
    TimeControlsModule,
    BsDropdownModule,
    PopoverModule,
    AlarmsModule,
  ],
  declarations: [DatapointsGraphWidgetViewComponent],
  providers: [ChartEventsService, ChartAlarmsService],
})
export class DatapointsGraphWidgetViewModule {}
