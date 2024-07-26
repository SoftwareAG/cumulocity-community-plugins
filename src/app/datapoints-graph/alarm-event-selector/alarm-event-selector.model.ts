import { AlarmStatusType, IIdentified } from '@c8y/client';
import { AlarmEventSelectorModalComponent } from './alarm-event-selector-modal/alarm-event-selector-modal.component';
import { SeverityType } from '@c8y/client/lib/src/core/Severity';
import { gettext } from '@c8y/ngx-components';

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
  __hidden?: boolean;
  __severity?: SeverityType[];
  __status?: AlarmStatusType[];
};

export type EventDetails = AlarmOrEventBase & {
  timelineType: 'EVENT';
  filters: {
    type: string;
  };
  __hidden?: boolean;
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
  addCustomText: string;
};

export const EVENT_TEXTS: TimelineTypeTexts = {
  listTitle: gettext('Events'),
  emptyStateIcon: gettext('c8y-events'),
  emptyStateTitle: gettext('No events to display.'),
  emptyStateSubtitle: gettext('Add your first event.'),
  addButtonLabel: gettext('Add event'),
  addCustomItemButtonLabel: gettext('Add custom event'),
  selectorTitle: gettext('Events selector'),
  availableItemsTitle: gettext('Available events'),
  assetWithNoItemsEmptyStateSubtitle: gettext(
    'Select an asset with events from the list.'
  ),
  largeNumberOfItemsInfo: gettext(
    'Due to the large number, only a subset of events are displayed. Use search to narrow down the number of results.'
  ),
  selectedItemsTitle: gettext('Selected events'),
  noSelectedItemsTitle: gettext('No events selected.'),
  recentItemsWarningTitle: gettext('The list below may not be complete.'),
  recentItemsWarningText: gettext(
    'Recent events are displayed below. Past events might not be shown..'
  ),
  addCustomText: gettext('Optionally you can add a custom event.'),
};

export const ALARM_TEXTS: TimelineTypeTexts = {
  listTitle: gettext('Alarms'),
  emptyStateIcon: gettext('c8y-alarm'),
  emptyStateTitle: gettext('No alarms to display.'),
  emptyStateSubtitle: gettext('Add your first alarm.'),
  addButtonLabel: gettext('Add alarm'),
  addCustomItemButtonLabel: gettext('Add custom alarm'),
  selectorTitle: gettext('Alarms selector'),
  availableItemsTitle: gettext('Available alarms'),
  assetWithNoItemsEmptyStateSubtitle: gettext(
    'Select an asset with alarms from the list.'
  ),
  largeNumberOfItemsInfo: gettext(
    'Due to the large number, only a subset of alarms are displayed. Use search to narrow down the number of results.'
  ),
  selectedItemsTitle: gettext('Selected alarms'),
  noSelectedItemsTitle: gettext('No alarms selected.'),
  recentItemsWarningTitle: gettext('The list below may not be complete.'),
  recentItemsWarningText: gettext(
    'Recent alarms are displayed below. Past alarms might not be shown.'
  ),
  addCustomText: gettext('Optionally you can add a custom alarm.'),
};
