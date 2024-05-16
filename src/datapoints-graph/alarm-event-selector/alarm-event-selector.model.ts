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
  };
};

export type EventDetails = AlarmOrEventBase & {
  timelineType: 'EVENT';
  filters: {
    type: string;
  };
};

export type AlarmOrEvent = AlarmDetails | EventDetails;

export type TimelineTypeTexts = {
  listTitle: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  addButtonLabel: string;
  addCustomItemButtonLabel: string;
  selectorTitle: string;
  availableItemsTitle: string;
  assetWithNoItemsEmptyStateSubtitle: string;
  largeNumberOfItemsInfo: string;
  selectedItemsTitle: string;
  noSelectedItemsTitle: string;
  recentItemsWarningTitle: string;
  recentItemsWarningText: string;
};
