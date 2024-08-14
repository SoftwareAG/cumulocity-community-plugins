import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import {
  ALARM_TEXTS,
  AlarmDetails,
  AlarmEventSelectorModalOptions,
  AlarmOrEvent,
  EVENT_TEXTS,
  EventDetails,
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
import { ColorService } from '@c8y/ngx-components';

@Injectable({ providedIn: 'root' })
export class AlarmEventSelectorService {
  private timelineTypeTextsMap: Map<TimelineType, TimelineTypeTexts> = new Map([
    ['ALARM', ALARM_TEXTS],
    ['EVENT', EVENT_TEXTS],
  ]);

  constructor(
    private modal: BsModalService,
    private alarmService: AlarmService,
    private eventsService: EventService,
    private color: ColorService
  ) {}

  timelineTypeTexts(timelineType: TimelineType): TimelineTypeTexts {
    return this.timelineTypeTextsMap.get(timelineType)!;
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

  async getAlarmsOrEvents(
    parentReference: IIdentified,
    timelineType: TimelineType
  ): Promise<AlarmOrEvent[]> {
    const filters = { source: parentReference.id!, pageSize: 1000 };

    return timelineType === 'ALARM'
      ? await this.getAlarmsOfAsset(parentReference, filters)
      : await this.getEventsOfAsset(parentReference, filters);
  }

  private async getAlarmsOfAsset(
    parentReference: IIdentified,
    filters: { pageSize: number; source: string | number }
  ): Promise<AlarmDetails[]> {
    const res = await this.alarmService.list({ ...filters, pageSize: 1000 });
    const alarms: Promise<AlarmDetails>[] = uniqBy(res.data, 'type').map(
      async (alarm: IAlarm) => this.createItem('ALARM', alarm, parentReference)
    );
    return await Promise.all(alarms);
  }

  private async getEventsOfAsset(
    parentReference: IIdentified,
    filters: { pageSize: number; source: string | number }
  ): Promise<EventDetails[]> {
    const res = await this.eventsService.list(filters);
    const alarms: Promise<EventDetails>[] = uniqBy(res.data, 'type').map(
      async (alarm: IEvent) => this.createItem('EVENT', alarm, parentReference)
    );
    return await Promise.all(alarms);
  }

  private async createItem(
    timelineType: 'ALARM' & TimelineType,
    item: IAlarm,
    parentReference: IIdentified
  ): Promise<AlarmDetails>;
  private async createItem(
    timelineType: 'EVENT' & TimelineType,
    item: IEvent,
    parentReference: IIdentified
  ): Promise<EventDetails>;
  private async createItem(
    timelineType: TimelineType,
    item: IAlarm | IEvent,
    parentReference: IIdentified
  ): Promise<any> {
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
