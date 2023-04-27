import { Injectable } from '@angular/core';
import {
  FetchClient,
  IFetchOptions,
  IFetchResponse,
  IResult,
  ISeries,
  ISeriesFilter,
  MeasurementService,
  Realtime,
} from '@c8y/client';
import { defer, Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { finalize, switchMap } from 'rxjs/operators';
import { ApiCall, ApiService } from '@c8y/ngx-components/api';
import { cloneDeep } from 'lodash-es';

@Injectable()
export class CustomMeasurementService extends MeasurementService {
  apiService: ApiService;
  constructor(client: FetchClient, realtime: Realtime, apiService: ApiService) {
    super(client, realtime);
    this.apiService = apiService;
  }

  listSeries$(params: ISeriesFilter): Observable<IResult<ISeries>> {
    const url = `/${this.baseUrl}/${this.listUrl}/series`;
    const fetchOptions: IFetchOptions = {
      params: {
        revert: true,
        ...params,
      },
    };
    const options = this.client.getFetchOptions(fetchOptions);
    const fullUrl: string = this.client.getUrl(url, fetchOptions);
    const callOnStart: ApiCall = {
      options,
      method: 'GET',
      url,
    };
    const callOnFinish: ApiCall = {
      ...cloneDeep(callOnStart),
      response: { status: null } as IFetchResponse,
    };

    return defer(() => {
      this.apiService.onStart(callOnStart);
      return fromFetch(fullUrl, options);
    }).pipe(
      switchMap(async (res) => {
        callOnFinish.response = res;
        const data = await res.json();
        return { res: res as IFetchResponse, data };
      }),
      finalize(() => {
        this.apiService.onFinish(callOnFinish);
      })
    );
  }
}
