import { NgModule } from '@angular/core';
import { DatapointsGraphWidgetConfigComponent } from './datapoints-graph-widget-config.component';
import { ChartsComponent } from '../charts';
import { CoreModule, FormsModule, CommonModule } from '@c8y/ngx-components';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { DatapointSelectorModule } from '@c8y/ngx-components/datapoint-selector';
import { TimeControlsModule } from '../time-controls';

@NgModule({
  imports: [
    CommonModule,
    ChartsComponent,
    CoreModule,
    TooltipModule,
    PopoverModule,
    FormsModule,
    DatapointSelectorModule,
    TimeControlsModule
  ],
  declarations: [DatapointsGraphWidgetConfigComponent],
})
export class DatapointsGraphWidgetConfigModule {}
