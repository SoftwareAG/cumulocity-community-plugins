import { IncludesAlarmOrEventPipe } from './includes-alarm.pipe';
import { AlarmDetails } from '../alarm-event-selector.model';
import { cloneDeep } from 'lodash-es';

describe('Pipe: IncludesAlarmOrEventPipe', () => {
  let pipe: IncludesAlarmOrEventPipe;
  const criticalAlarmDetails: AlarmDetails = {
    timelineType: 'ALARM',
    __active: true,
    __target: { id: '1' },
    filters: { type: 'c8y_UnavailabilityAlarm' },
    color: 'red',
    label: 'Critical alarm',
  };
  beforeEach(() => {
    pipe = new IncludesAlarmOrEventPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return false if something else than an array was passed as first argument', () => {
    expect(pipe.transform(undefined, criticalAlarmDetails)).toEqual(false);
    expect(pipe.transform(null, criticalAlarmDetails)).toEqual(false);
  });

  it('should return false if second argument is falsy', () => {
    expect(pipe.transform([], undefined)).toEqual(false);
    expect(pipe.transform([], null)).toEqual(false);
    expect(pipe.transform([])).toEqual(false);
  });

  it('should return true if alarm is included in array', () => {
    const criticalAlarmDetailsCopy = cloneDeep(criticalAlarmDetails);
    expect(
      pipe.transform([criticalAlarmDetailsCopy], criticalAlarmDetails)
    ).toEqual(true);
  });

  it('should return true if alarm is included in array even if some attributes are different', () => {
    const criticalAlarmDetailsCopy: AlarmDetails = {
      ...criticalAlarmDetails,
      color: 'blue',
    };
    expect(
      pipe.transform([criticalAlarmDetailsCopy], criticalAlarmDetails)
    ).toEqual(true);
  });

  it('should return false if label is different', () => {
    const criticalAlarmDetailsCopy: AlarmDetails = {
      ...criticalAlarmDetails,
      label: 'Critical alarm 2',
    };
    expect(
      pipe.transform([criticalAlarmDetailsCopy], criticalAlarmDetails)
    ).toEqual(false);
  });

  it('should return false if type is different', () => {
    const criticalAlarmDetailsCopy: AlarmDetails = {
      ...criticalAlarmDetails,
      filters: { type: 'c8y_OverheatAlarm' },
    };
    expect(
      pipe.transform([criticalAlarmDetailsCopy], criticalAlarmDetails)
    ).toEqual(false);
  });

  it('should return false if target id is different', () => {
    const criticalAlarmDetailsCopy: AlarmDetails = {
      ...criticalAlarmDetails,
      __target: { id: 2 },
    };
    expect(
      pipe.transform([criticalAlarmDetailsCopy], criticalAlarmDetails)
    ).toEqual(false);
  });
});
