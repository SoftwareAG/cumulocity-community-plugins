import { IIdentified } from '@c8y/client';
import { AlarmSelectorModalComponent } from './alarm-selector-modal.component';
import { gettext } from '@c8y/ngx-components';

export type TimelineType = 'ALARM' | 'EVENT';

export type AlarmSelectorModalOptions = Pick<
  AlarmSelectorModalComponent,
  'contextAsset' | 'allowChangingContext' | 'selectedAlarms' | 'allowSearch'
>;

export type AlarmOrEvent = {
  timelineType: TimelineType;
  color: string;
  __active?: boolean;
  label: string;
  filters: {
    type: string;
  };
  __target: IIdentified;
};

export type AlarmDetails = AlarmOrEvent & {
  timelineType: 'ALARM';
  filters: {
    type: string;
    severities: Record<keyof typeof SEVERITY_VALUES, boolean>;
  };
};

export type EventDetails = AlarmOrEvent & {
  timelineType: 'EVENT';
  filters: {
    type: string;
  };
};

export const SEVERITY_VALUES = {
  CRITICAL: 'CRITICAL',
  MAJOR: 'MAJOR',
  MINOR: 'MINOR',
  WARNING: 'WARNING',
} as const;

export const DEFAULT_SEVERITY_VALUES = {
  [SEVERITY_VALUES.CRITICAL]: true,
  [SEVERITY_VALUES.MAJOR]: true,
  [SEVERITY_VALUES.MINOR]: true,
  [SEVERITY_VALUES.WARNING]: true,
};

export const SEVERITY_LABELS = {
  CRITICAL: gettext('Critical`alarm`') as 'CRITICAL',
  MAJOR: gettext('Major`alarm`') as 'MAJOR',
  MINOR: gettext('Minor`alarm`') as 'MINOR',
  WARNING: gettext('Warning`alarm`') as 'WARNING',
} as const;
