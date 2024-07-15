import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { gettext } from '@c8y/ngx-components';
import { SeverityType, SEVERITY_LABELS } from '@c8y/client';

/**
 * Pipe for transforming an array of alarm severity types into a comma-separated string.
 *
 * @example
 * Usage in a template: {{ ['WARNING', 'CRITICAL'] | AlarmSeveritiesToTitle }}
 * Result: 'Warning, Critical'
 */
@Pipe({
  name: 'AlarmSeveritiesToTitle',
})
export class AlarmSeveritiesToTitlePipe implements PipeTransform {
  private readonly severityOptionsCount = Object.keys(SEVERITY_LABELS).length;

  constructor(private translateService: TranslateService) {}
  /**
   * Transforms an array of alarm severity types into a comma-separated string.
   *
   * @param severities - Array of severity types.
   * @returns - Transformed human-readable title string.
   */
  transform(severities: SeverityType[]): string {
    if (severities.length === this.severityOptionsCount) {
      return this.translateService.instant(gettext('All alarms'));
    }
    const translatedChips = severities.map((severity) =>
      this.translateSeverityLabel(severity)
    );
    return translatedChips.join(', ');
  }
  /**
   * Translates and converts a severity type to title case.
   *
   * @private
   * @param chip - Severity type.
   * @returns - Translated and title-cased severity type.
   */
  private translateSeverityLabel(chip: SeverityType): string {
    return this.translateService.instant(SEVERITY_LABELS[chip]);
  }
}
