import { AlarmEventSelectorService } from './alarm-event-selector.service';
import { TestBed } from '@angular/core/testing';
import { ColorService } from '@c8y/ngx-components';
import { BsModalService } from 'ngx-bootstrap/modal';
import {
  AlarmService,
  EventService,
  IAlarm,
  IEvent,
  IIdentified,
  IResultList,
} from '@c8y/client';
import { AlarmDetails } from './alarm-event-selector.model';

describe('AlarmEventSelectorService', () => {
  let service: AlarmEventSelectorService;
  let modal: BsModalService;
  let alarmService: AlarmService;
  let eventService: EventService;
  let colorService: ColorService;

  beforeEach(() => {
    modal = {
      show: jest.fn().mockName('show'),
    } as any as BsModalService;
    alarmService = {
      list: jest.fn().mockName('list'),
    } as any as AlarmService;
    eventService = {
      list: jest.fn().mockName('list'),
    } as any as EventService;
    colorService = {
      generateColor: jest.fn().mockName('generateColor'),
    } as any as ColorService;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BsModalService,
          useValue: modal,
        },
        { provide: AlarmService, useValue: alarmService },
        { provide: EventService, useValue: eventService },
        { provide: ColorService, useValue: colorService },
      ],
    });
    service = TestBed.inject(AlarmEventSelectorService);
  });

  it('should exist', () => {
    expect(service).toBeTruthy();
  });

  it('selectItems', async () => {
    // given
    const selectedItem: AlarmDetails = {
      timelineType: 'ALARM',
      __active: true,
      __target: { id: '1' } as any as IIdentified,
      color: 'red',
      label: 'Critical alarm',
      filters: {
        type: 'alarm',
      },
    };
    jest
      .spyOn(modal, 'show')
      .mockReturnValue({ content: { result: [selectedItem] } } as any);
    // when
    const items = await service.selectItems({});
    // then
    expect(items).toEqual([selectedItem]);
  });

  describe('getItemsOfAsset', () => {
    it('getItemsOfAsset for alarms', async () => {
      // given
      const mockAlarms: IAlarm[] = [
        { type: 'c8y_UnavailabilityAlarm' } as any as IAlarm,
        { type: 'c8y_OverheatAlarm' } as any as IAlarm,
      ];
      jest
        .spyOn(alarmService, 'list')
        .mockReturnValue(
          Promise.resolve({ data: mockAlarms }) as Promise<IResultList<IAlarm>>
        );
      jest
        .spyOn(colorService, 'generateColor')
        .mockReturnValue(Promise.resolve('blue'));
      // when
      const items = await service.getItemsOfAsset({ id: 1 }, 'ALARM');
      // then
      expect(items).toEqual([
        {
          timelineType: 'ALARM',
          color: 'blue',
          label: 'c8y_UnavailabilityAlarm',
          filters: {
            type: 'c8y_UnavailabilityAlarm',
          },
          __target: { id: 1 },
        },
        {
          timelineType: 'ALARM',
          color: 'blue',
          label: 'c8y_OverheatAlarm',
          filters: {
            type: 'c8y_OverheatAlarm',
          },
          __target: { id: 1 },
        },
      ]);
    });

    it('getItemsOfAsset for events', async () => {
      // given
      const mockEvents: IEvent[] = [
        { type: 'c8y_LocationUpdate' } as any as IEvent,
      ];
      jest
        .spyOn(eventService, 'list')
        .mockReturnValue(
          Promise.resolve({ data: mockEvents }) as Promise<IResultList<IEvent>>
        );
      jest
        .spyOn(colorService, 'generateColor')
        .mockReturnValue(Promise.resolve('blue'));
      // when
      const items = await service.getItemsOfAsset({ id: 1 }, 'EVENT');
      // then
      expect(items).toEqual([
        {
          timelineType: 'EVENT',
          color: 'blue',
          label: 'c8y_LocationUpdate',
          filters: {
            type: 'c8y_LocationUpdate',
          },
          __target: { id: 1 },
        },
      ]);
    });
  });
});
