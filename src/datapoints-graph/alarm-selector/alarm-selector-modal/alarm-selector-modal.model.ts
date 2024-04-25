import { IIdentified } from '@c8y/client';
import { gettext } from '@c8y/ngx-components';

export type TimelineType = 'ALARM' | 'EVENT';

export const ALARM_EVENT_TIMELINE_TYPES: {
  // TODO: is name necessary?
  name: TimelineType;
  value: TimelineType;
  label: string;
}[] = [
  { name: 'ALARM', value: 'ALARM', label: gettext('Alarm') },
  { name: 'EVENT', value: 'EVENT', label: gettext('Event') },
];

export type AlarmSelectorModalOptions = {
  contextAsset: IIdentified;
};

export type AlarmOrEvent = {
  timelineType: TimelineType;
  color: string;
  __active: boolean;
  label: string;
  filters: {
    type: string;
  };
  __target: IIdentified;
};

export type AlarmDetails = AlarmOrEvent & {
  timelineType: 'ALARM';
};

export type EventDetails = AlarmOrEvent & {
  timelineType: 'EVENT';
};
