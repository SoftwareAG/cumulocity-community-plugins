import { Injectable } from '@angular/core';
import {
  AlarmService,
  FetchClient,
  IFetchOptions,
  IFetchResponse,
  IResult,
  Realtime,
} from '@c8y/client';
import { ApiService } from '@c8y/ngx-components/api';

@Injectable()
export class CustomAlarmsService extends AlarmService {
  apiService: ApiService;
  constructor(client: FetchClient, realtime: Realtime, apiService: ApiService) {
    super(client, realtime);
    this.apiService = apiService;
  }

  async listAlarms$(params?, type?) {
    const url = `/${this.baseUrl}/alarms`;
    const fetchOptions: IFetchOptions = {
      params: {
        source: 7713695199,
        type: type,
        withTotalPages: true,
        pageSize: 1000,
        ...params,
      },
    };
    const options = this.client.getFetchOptions(fetchOptions);
    const fullUrl: string = this.client.getUrl(url, fetchOptions);

    const response = await fetch(fullUrl, options);
    const data = await response.json();
    const result: IResult<any> = {
      res: response as IFetchResponse,
      data: data,
    };
    return result;
  }
}
