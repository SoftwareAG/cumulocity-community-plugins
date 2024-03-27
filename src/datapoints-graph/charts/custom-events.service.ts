import { Injectable } from '@angular/core';
import {
  EventService,
  FetchClient,
  IFetchOptions,
  IFetchResponse,
  IResult,
  ISeries,
  Realtime,
} from '@c8y/client';
import { ApiService } from '@c8y/ngx-components/api';

@Injectable()
export class CustomEventsService extends EventService {
  apiService: ApiService;
  constructor(client: FetchClient, realtime: Realtime, apiService: ApiService) {
    super(client, realtime);
    this.apiService = apiService;
  }

  async listEvents$(params?) {
    const url = `/${this.baseUrl}/events`;
    const fetchOptions: IFetchOptions = {
      params: {
        source: 7713695199,
        type: 'TestEvent',
        withTotalPages: true,
        pageSize: 1000,
        ...params,
      },
    };
    const options = this.client.getFetchOptions(fetchOptions);
    const fullUrl: string = this.client.getUrl(url, fetchOptions);

    const response = await fetch(fullUrl, options);
    const data = await response.json();
    const result: IResult<ISeries> = {
      res: response as IFetchResponse,
      data: data,
    };
    return result;
  }
}
