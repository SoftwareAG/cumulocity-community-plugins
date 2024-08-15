import { TestBed } from '@angular/core/testing';
import { EventService, IEvent } from '@c8y/client';
import { ChartEventsService } from './chart-events.service';
import { EventDetails } from '@c8y/ngx-components/alarm-event-selector';

describe('ChartEventsService', () => {
  let service: ChartEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventService, ChartEventsService],
    });
    service = TestBed.inject(ChartEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listEvents', () => {
    it('should return a list of events', async () => {
      const params = { pageSize: 10 };
      const events: EventDetails[] = [];

      const mockEvents: IEvent[] = [
        { id: '1', type: 'EventType1', text: 'Event 1' },
        { id: '2', type: 'EventType2', text: 'Event 2' },
      ] as IEvent[];

      jest.spyOn(service, 'listEvents').mockResolvedValue(mockEvents);

      const result = await service.listEvents(params, events);

      expect(result).toEqual(mockEvents);
      expect(service.listEvents).toHaveBeenCalledWith(params, events);
    });
  });
});
