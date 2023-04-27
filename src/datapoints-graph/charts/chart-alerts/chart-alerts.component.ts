import { Component, Input } from '@angular/core';
import { CommonModule, DynamicComponentAlertAggregator } from '@c8y/ngx-components';

@Component({
  selector: 'c8y-chart-alerts',
  templateUrl: './chart-alerts.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class ChartAlertsComponent {
  @Input() alerts: DynamicComponentAlertAggregator;
}
