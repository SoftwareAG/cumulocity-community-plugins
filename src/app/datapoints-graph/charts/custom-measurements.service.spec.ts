import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FetchClient, ISeries, Realtime } from '@c8y/client';
import { ApiService } from '@c8y/ngx-components/api';
import { firstValueFrom } from 'rxjs';
import { CustomMeasurementService } from './custom-measurements.service';

describe('CustomMeasurementService', () => {
  let service: CustomMeasurementService;
  let apiService: ApiService;
  let client: FetchClient;
  const options = {
    headers: { 'X-XSRF-TOKEN': 'dshjfgbajsdhbfsd', UseXBasic: true },
  };
  const fullUrl =
    'http://localhost:9000/measurement/measurements/series?source=72172&series=c8y_Temperature.T&aggregationType=MINUTELY';
  const response = { json: jest.fn().mockName('json').mockImplementation() };

  beforeEach(() => {
    apiService = {
      onStart: jest.fn().mockName('onStart'),
      onFinish: jest.fn().mockName('onFinish'),
    } as any as ApiService;

    client = {
      getFetchOptions: jest
        .fn()
        .mockName('getFetchOptions')
        .mockReturnValue(options),
      getUrl: jest.fn().mockName('getFetchOptions').mockReturnValue(fullUrl),
      fetch: jest
        .fn()
        .mockName('fetch')
        .mockImplementation(() => Promise.resolve(response)),
    } as any as FetchClient;
    TestBed.configureTestingModule({
      providers: [
        { provide: FetchClient, useValue: client },
        { provide: Realtime, useValue: {} },
        {
          provide: ApiService,
          useValue: apiService,
        },
        CustomMeasurementService,
      ],
    });
    service = TestBed.inject(CustomMeasurementService);
  });

  it('should exist', () => {
    expect(service).toBeTruthy();
  });

  it('should call onStart to trigger header loading bar', fakeAsync(() => {
    // when
    (global as any).fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(response));
    service.listSeries$({} as any).subscribe();
    tick();
    // then
    expect(apiService.onStart).toHaveBeenCalledWith({
      options,
      method: 'GET',
      url: '/measurement/measurements/series',
    });
  }));

  it('should call onFinish to trigger header loading bar', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce(response);

    await firstValueFrom(service.listSeries$({} as any));
    expect(apiService.onFinish).toHaveBeenCalledWith({
      method: 'GET',
      options,
      response,
      url: '/measurement/measurements/series',
    });
  });

  it('should return resolved data', (done) => {
    // when
    const values = { [new Date().toString()]: [{ min: 0, max: 1 }] };
    (global as any).fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        json: () => ({ values } as ISeries),
      })
    );
    service.listSeries$({} as any).subscribe((val) => {
      expect(val.data.values).toEqual(values);
      done();
    });
  });
});
