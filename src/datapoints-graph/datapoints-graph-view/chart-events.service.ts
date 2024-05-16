import { Injectable } from '@angular/core';
import {
  EventService,
  FetchClient,
  IEvent,
  IFetchOptions,
  IFetchResponse,
  IResult,
  Realtime,
} from '@c8y/client';
import { ApiService } from '@c8y/ngx-components/api';
import { Event } from '../model';

@Injectable()
export class ChartEventsService extends EventService {
  apiService: ApiService;
  constructor(client: FetchClient, realtime: Realtime, apiService: ApiService) {
    super(client, realtime);
    this.apiService = apiService;
  }

  listEvents$(params?, events?: Event[]): Promise<IEvent[]> {
    return new Promise<IEvent[]>(async (resolve) => {
      const url = `/${this.baseUrl}/events`;
      const allEvents: IEvent[] = [];
      for (const event of events) {
        const fetchOptions: IFetchOptions = {
          params: {
            source: event.__target.id,
            type: event.filters.type,
            withTotalPages: true,
            pageSize: 1000,
            ...params,
          },
        };
        const result = await this.getEvents(url, fetchOptions);
        result.data.forEach((iEvent) => {
          iEvent.color = event.color;
        });
        allEvents.push(...result.data);
      }
      resolve(allEvents);
    });
  }

  private async getEvents(
    url: string,
    fetchOptions: IFetchOptions
  ): Promise<IResult<IEvent[]>> {
    const options = this.client.getFetchOptions(fetchOptions);
    const fullUrl: string = this.client.getUrl(url, fetchOptions);

    const response = await fetch(fullUrl, options);
    const data = await response.json();
    const result: IResult<IEvent[]> = {
      res: response as IFetchResponse,
      data: data.events as IEvent[],
    };
    return result;
  }
}
