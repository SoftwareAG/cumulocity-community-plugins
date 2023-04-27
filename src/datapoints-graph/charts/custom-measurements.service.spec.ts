import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FetchClient, ISeries, Realtime } from '@c8y/client';
import { ApiService } from '@c8y/ngx-components/api';
import { CustomMeasurementService } from './custom-measurements.service';

describe('CustomMeasurementService', () => {
  let service: CustomMeasurementService;
  let apiService: ApiService;
  let client: FetchClient;
  const options = { headers: { 'X-XSRF-TOKEN': 'dshjfgbajsdhbfsd', UseXBasic: true } };
  const fullUrl =
    'http://localhost:9000/measurement/measurements/series?source=72172&series=c8y_Temperature.T&aggregationType=MINUTELY';
  const response = { json: () => {} };

  beforeEach(() => {
    apiService = {
      onStart: jest.fn().mockName('onStart'),
      onFinish: jest.fn().mockName('onFinish')
    } as any as ApiService;

    client = {
      getFetchOptions: jest.fn().mockName('getFetchOptions').mockReturnValue(options),
      getUrl: jest.fn().mockName('getFetchOptions').mockReturnValue(fullUrl),
      fetch: jest
        .fn()
        .mockName('fetch')
        .mockImplementation(() => {})
    } as any as FetchClient;
    TestBed.configureTestingModule({
      providers: [
        CustomMeasurementService,
        { provide: FetchClient, useValue: client },
        { provide: Realtime, useValue: {} },
        {
          provide: ApiService,
          useValue: apiService
        }
      ]
    });
    service = TestBed.inject(CustomMeasurementService);
  });

  it('should exist', () => {
    expect(service).toBeTruthy();
  });

  it('should call onStart to trigger header loading bar', fakeAsync(() => {
    // when
    (global as any).fetch = jest.fn().mockImplementationOnce(() => Promise.resolve(response));
    service.listSeries$({} as any).subscribe();
    tick();
    // then
    expect(apiService.onStart).toHaveBeenCalledWith({
      options,
      method: 'GET',
      url: '/measurement/measurements/series'
    });
  }));

  it('should call onFinish to trigger header loading bar', fakeAsync(() => {
    // when
    (global as any).fetch = jest.fn().mockImplementationOnce(() => Promise.resolve(response));
    service.listSeries$({} as any).subscribe();
    tick();
    // then
    expect(apiService.onFinish).toHaveBeenCalledWith({
      options,
      method: 'GET',
      url: '/measurement/measurements/series',
      response
    });
  }));

  it('should return resolved data', fakeAsync(() => {
    // when
    const values = { [new Date().toString()]: [{ min: 0, max: 1 }] };
    (global as any).fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        json: () => ({ values } as ISeries)
      })
    );
    let resolvedData;
    service.listSeries$({} as any).subscribe(val => (resolvedData = val.data));
    tick();
    // then
    expect(resolvedData.values).toEqual(values);
  }));
});
