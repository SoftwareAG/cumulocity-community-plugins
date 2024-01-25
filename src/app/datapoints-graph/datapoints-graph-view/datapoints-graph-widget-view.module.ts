import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatapointsGraphWidgetViewComponent } from './datapoints-graph-widget-view.component';
import { TimeControlsModule } from '../time-controls';
import { ChartsComponent } from '../charts';
import { CoreModule } from '@c8y/ngx-components';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  imports: [
    CommonModule,
    ChartsComponent,
    CoreModule,
    TooltipModule,
    TimeControlsModule,
  ],
  declarations: [DatapointsGraphWidgetViewComponent],
})
export class DatapointsGraphWidgetViewModule {}
