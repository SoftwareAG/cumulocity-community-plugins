import { Pipe, PipeTransform } from '@angular/core';
import { SEVERITY_LABELS } from '@c8y/client';
import { TranslateService } from '@ngx-translate/core';

/**
 * Pipe to transform alarm severity to corresponding label.
 */
@Pipe({
  name: 'AlarmSeverityToLabel'
})
export class AlarmSeverityToLabelPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  /**
   * Transforms an alarm severity to its corresponding label.
   * @param alarmSeverity - The alarm severity to transform.
   * @returns The translated label corresponding to the given alarm severity.
   */
  transform(alarmSeverity: string): string {
    const alarmStatusMapped = SEVERITY_LABELS[alarmSeverity?.toUpperCase()];
    return this.translateService.instant(alarmStatusMapped);
  }
}
