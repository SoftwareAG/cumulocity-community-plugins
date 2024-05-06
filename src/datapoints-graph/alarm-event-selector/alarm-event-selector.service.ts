import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import {
  AlarmDetails,
  AlarmEventSelectorModalOptions,
  AlarmOrEvent,
  DEFAULT_SEVERITY_VALUES,
  TimelineType,
  TimelineTypeTexts,
} from './alarm-event-selector.model';
import { AlarmEventSelectorModalComponent } from './alarm-event-selector-modal/alarm-event-selector-modal.component';
import {
  AlarmService,
  EventService,
  IAlarm,
  IEvent,
  IIdentified,
} from '@c8y/client';
import { uniqBy } from 'lodash-es';
import { ColorService, gettext } from '@c8y/ngx-components';

@Injectable({ providedIn: 'root' })
export class AlarmEventSelectorService {
  constructor(
    private modal: BsModalService,
    private alarmService: AlarmService,
    private eventsService: EventService,
    private color: ColorService
  ) {}

  timelineTypeTexts(timelineType: TimelineType): TimelineTypeTexts {
    if (timelineType === 'ALARM') {
      return {
        listTitle: gettext('Alarms'),
        emptyStateIcon: gettext('c8y-alarm'),
        emptyStateTitle: gettext('No alarms to display.'),
        emptyStateSubtitle: gettext('Add your first alarm.'),
        addButtonLabel: gettext('Add alarm'),
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
      };
    }
    return {
      listTitle: gettext('Events'),
      emptyStateIcon: gettext('c8y-events'),
      emptyStateTitle: gettext('No events to display.'),
      emptyStateSubtitle: gettext('Add your first event.'),
      addButtonLabel: gettext('Add event'),
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
    };
  }

  selectItems(
    initialState: Partial<AlarmEventSelectorModalOptions> = {}
  ): Promise<AlarmOrEvent[]> {
    const modal = this.modal.show(AlarmEventSelectorModalComponent, {
      ignoreBackdropClick: true,
      keyboard: false,
      initialState,
      class: 'modal-lg',
    });
    const content = modal.content as AlarmEventSelectorModalComponent;
    return content.result;
  }

  async getItemsOfAsset(
    parentReference: IIdentified,
    timelineType: TimelineType
  ): Promise<AlarmDetails[]> {
    const filters = { source: parentReference.id, pageSize: 10 };

    return timelineType === 'ALARM'
      ? await this.getAlarmsOfAsset(parentReference, filters)
      : await this.getEventsOfAsset(parentReference, filters);
  }

  getBlankItem(
    timelineType: TimelineType,
    asset: IIdentified,
    blankItemColor: string
  ): AlarmOrEvent | null {
    if (!asset) {
      return null;
    } else if (timelineType === 'ALARM') {
      return {
        timelineType: 'ALARM',
        color: blankItemColor,
        label: '',
        filters: {
          type: '',
          severities: DEFAULT_SEVERITY_VALUES,
        },
        __target: asset,
      };
    } else {
      return {
        timelineType: 'EVENT',
        color: blankItemColor,
        label: '',
        filters: {
          type: '',
        },
        __target: asset,
      };
    }
  }

  private async getAlarmsOfAsset(
    parentReference: IIdentified,
    filters: { pageSize: number; source: string | number }
  ) {
    const res = await this.alarmService.list(filters);
    const alarms: AlarmDetails[] = uniqBy(res.data, 'type').map(
      async (alarm: IAlarm) => this.createItem('ALARM', alarm, parentReference)
    );
    return await Promise.all(alarms);
  }

  private async getEventsOfAsset(
    parentReference: IIdentified,
    filters: { pageSize: number; source: string | number }
  ) {
    const res = await this.eventsService.list(filters);
    const alarms: AlarmDetails[] = uniqBy(res.data, 'type').map(
      async (alarm: IAlarm) => this.createItem('EVENT', alarm, parentReference)
    );
    return await Promise.all(alarms);
  }

  private async createItem(
    timelineType: TimelineType,
    item: IAlarm | IEvent,
    parentReference: IIdentified
  ): Promise<AlarmOrEvent> {
    const color = await this.color.generateColor(item.type);
    return {
      timelineType,
      color,
      label: item.type,
      filters: {
        type: item.type,
      },
      __target: parentReference,
    };
  }
}
