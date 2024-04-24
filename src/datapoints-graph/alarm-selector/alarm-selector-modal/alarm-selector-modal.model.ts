import { IIdentified } from '@c8y/client';

export type TimelineType = 'ALARM' | 'EVENT';

export type AlarmSelectorModalOptions = {
  contextAsset: IIdentified;
};

export type AlarmDetails = {
  timelineType: 'ALARM';
  color: string;
  __active: boolean;
  label: string;
  filters: {
    type: string;
  };
  __target: IIdentified;
};
