import { Pipe, PipeTransform } from '@angular/core';
import { SEVERITY_VALUES } from '../alarm-event-selector-modal/alarm-event-selector-modal.model';

interface SeverityIcon {
  c8yIcon?: string;
  iconClass: string;
  severityClass?: string;
}

@Pipe({
  name: 'severityIcon',
})
export class SeverityIconPipe implements PipeTransform {
  transform(severity: string): SeverityIcon {
    let severityClassName = '';
    let iconClassName = '';

    switch (severity) {
      case SEVERITY_VALUES.CRITICAL:
        severityClassName = 'critical';
        iconClassName = 'exclamation-circle';
        break;
      case SEVERITY_VALUES.MAJOR:
        severityClassName = 'major';
        iconClassName = 'warning';
        break;
      case SEVERITY_VALUES.MINOR:
        severityClassName = 'minor';
        iconClassName = 'high-priority';
        break;
      case SEVERITY_VALUES.WARNING:
        severityClassName = 'warning';
        iconClassName = 'circle';
        break;
      default:
        return { iconClass: '', severityClass: '' };
    }

    return {
      iconClass: `status icon-lg stroked-icon dlt-c8y-icon-${iconClassName} ${severityClassName}`,
      c8yIcon: severityClassName,
    };
  }
}
