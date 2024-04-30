import { IIdentified } from '@c8y/client';
import { gettext } from '@c8y/ngx-components';
import { AlarmEventSelectorModalComponent } from './alarm-event-selector-modal/alarm-event-selector-modal.component';

export type TimelineType = 'ALARM' | 'EVENT';

export type AlarmEventSelectorModalOptions = Pick<
  AlarmEventSelectorModalComponent,
  | 'selectType'
  | 'contextAsset'
  | 'allowChangingContext'
  | 'selectedItems'
  | 'allowSearch'
  | 'title'
  | 'saveButtonLabel'
>;

type AlarmOrEventBase = {
  timelineType: TimelineType;
  color: string;
  __active?: boolean;
  label: string;
  filters: {
    type: string;
  };
  __target: IIdentified;
};

export type AlarmDetails = AlarmOrEventBase & {
  timelineType: 'ALARM';
  filters: {
    type: string;
    severities?: Record<keyof typeof SEVERITY_VALUES, boolean>;
  };
};

export type EventDetails = AlarmOrEventBase & {
  timelineType: 'EVENT';
  filters: {
    type: string;
  };
};

export type AlarmOrEvent = AlarmDetails | EventDetails;

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
