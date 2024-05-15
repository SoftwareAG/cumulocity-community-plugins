import { Injectable } from '@angular/core';
import {
  AlarmService,
  FetchClient,
  IAlarm,
  IFetchOptions,
  IFetchResponse,
  IResult,
  Realtime,
} from '@c8y/client';
import { ApiService } from '@c8y/ngx-components/api';
import { Alarm } from '../model';
import { Observable, from } from 'rxjs';

@Injectable()
export class ChartAlarmsService extends AlarmService {
  apiService: ApiService;
  constructor(client: FetchClient, realtime: Realtime, apiService: ApiService) {
    super(client, realtime);
    this.apiService = apiService;
  }

  listAlarms$(params?, alarms?: Alarm[]): Promise<IAlarm[]> {
    return new Promise<IAlarm[]>(async (resolve) => {
      const url = `/${this.baseUrl}/alarms`;
      const allAlarms: IAlarm[] = [];
      for (const alarm of alarms) {
        const fetchOptions: IFetchOptions = {
          params: {
            source: alarm.__target.id,
            type: alarm.filters.type,
            withTotalPages: true,
            pageSize: 1000,
            ...params,
          },
        };
        const result = await this.getAlarms(url, fetchOptions);
        result.data.forEach((iAlarm) => {
          iAlarm.color = alarm.color;
        });
        allAlarms.push(...result.data);
      }
      resolve(allAlarms);
    });
  }

  private async getAlarms(
    url: string,
    fetchOptions: IFetchOptions
  ): Promise<IResult<IAlarm[]>> {
    const options = this.client.getFetchOptions(fetchOptions);
    const fullUrl: string = this.client.getUrl(url, fetchOptions);

    const response = await fetch(fullUrl, options);
    const data = await response.json();
    const result: IResult<IAlarm[]> = {
      res: response as IFetchResponse,
      data: data.alarms as IAlarm[],
    };
    return result;
  }
}
