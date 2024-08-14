import { Pipe, PipeTransform } from '@angular/core';
import { Severity, SeverityType } from '@c8y/client';
import { ALARM_SEVERITY_ICON_MAP, AlarmSeverityIcon } from './alarms.model';

/**
 * Pipe for transforming alarm severity types into corresponding icons.
 *
 * @example
 * Usage in an Angular template:
 * {{ 'CRITICAL' | AlarmSeverityToIcon }}
 * Result: 'exclamation-circle'
 */
@Pipe({
  name: 'AlarmSeverityToIcon',
})
export class AlarmSeverityToIconPipe implements PipeTransform {
  /**
   * Transforms an alarm severity type into a corresponding icon.
   *
   * @param alarmSeverity - The severity type of the alarm.
   * @returns The corresponding icon for the given alarm severity type.
   */
  transform(alarmSeverity: SeverityType): AlarmSeverityIcon {
    const alarmSeverityMapped = Severity[alarmSeverity?.toUpperCase()];
    return ALARM_SEVERITY_ICON_MAP[alarmSeverityMapped];
  }
}
