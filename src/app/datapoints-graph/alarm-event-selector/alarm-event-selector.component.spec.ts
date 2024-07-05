import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ColorService, CommonModule, FormsModule } from '@c8y/ngx-components';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { AlarmEventSelectorComponent } from './alarm-event-selector.component';
import { AlarmEventSelectorService } from './alarm-event-selector.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AlarmDetails, AlarmOrEvent } from './alarm-event-selector.model';
import {
  AssetSelectionChangeEvent,
  AssetSelectorOptions,
} from '@c8y/ngx-components/assets-navigator';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { IIdentified } from '@c8y/client';

@Component({
  selector: 'c8y-asset-selector-miller',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MillerViewMockComponent),
      multi: true,
    },
  ],
})
class MillerViewMockComponent {
  @Input() config: AssetSelectorOptions | undefined;
  @Input() rootNode: any;
  @Input() asset: string | number | undefined;
  @Input() container: string | undefined;
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onSelected = new EventEmitter<any>();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  writeValue = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOnChange = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOnTouched = () => {};
}

describe('AlarmEventSelectorComponent', () => {
  let component: AlarmEventSelectorComponent;
  let fixture: ComponentFixture<AlarmEventSelectorComponent>;
  let alarmEventSelectorService: AlarmEventSelectorService;
  const defaultColor = 'red';
  let color: ColorService;
  let alarm1: AlarmDetails;
  let asset1: IIdentified;

  beforeEach(async () => {
    asset1 = { id: 1 };
    alarm1 = {
      timelineType: 'ALARM',
      color: defaultColor,
      label: 'c8y_UnavailabilityAlarm',
      filters: {
        type: 'UnavailabilityAlarm',
      },
      __target: asset1,
    };

    alarmEventSelectorService = {
      getItemsOfAsset: jest
        .fn()
        .mockName('getItemsOfAsset')
        .mockImplementation(() => null),
      timelineTypeTexts: jest
        .fn()
        .mockName('timelineTypeTexts')
        .mockReturnValue({ selectedItemsTitle: 'items' }),
    } as any as AlarmEventSelectorService;

    color = {
      generateColor: jest
        .fn()
        .mockName('generateColor')
        .mockReturnValue(defaultColor),
    } as any as ColorService;

    await TestBed.configureTestingModule({
      imports: [CommonModule.forRoot(), FormsModule, ReactiveFormsModule],
      declarations: [AlarmEventSelectorComponent, MillerViewMockComponent],
      providers: [
        {
          provide: AlarmEventSelectorService,
          useValue: alarmEventSelectorService,
        },
        {
          provide: ColorService,
          useValue: color,
        },
        BsModalService,
      ],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(AlarmEventSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should setup items$ observable and emit values', fakeAsync(() => {
      // given
      jest
        .spyOn(alarmEventSelectorService, 'getItemsOfAsset')
        .mockReturnValue(
          new Promise((resolve) => setTimeout(() => resolve([alarm1]), 1000))
        );
      let result: AlarmOrEvent[] = [];
      // when
      fixture.detectChanges();
      tick();
      component.items$.subscribe((items) => (result = items));
      component.assetSelection.next(asset1);
      tick(500);
      expect(component.loadingItems).toBe(true);
      tick(500);
      // then
      expect(result).toEqual([alarm1]);
    }));

    it('should setup filteredItems$ observable and emit matching values', fakeAsync(() => {
      // given
      const alarm2: AlarmDetails = {
        timelineType: 'ALARM',
        color: defaultColor,
        label: 'OverheatAlarm',
        filters: {
          type: 'c8y_OverheatAlarm',
        },
        __target: asset1,
      };
      const alarm3: AlarmDetails = {
        timelineType: 'ALARM',
        color: defaultColor,
        label: '_OtherAlarm',
        filters: {
          type: '_OtherAlarm',
        },
        __target: asset1,
      };

      jest
        .spyOn(alarmEventSelectorService, 'getItemsOfAsset')
        .mockReturnValue(Promise.resolve([alarm1, alarm2, alarm3]));
      let result: AlarmOrEvent[] = [];
      fixture.detectChanges();
      tick();
      component.filteredItems$.subscribe((items) => (result = items));
      component.assetSelection.next({ id: 1 });

      // when
      component.filterStringChanged('');
      tick(500);
      // then
      expect(result).toEqual([alarm1, alarm2, alarm3]);

      // when
      component.filterStringChanged('c8y');
      tick(500);
      // then
      expect(result).toEqual([alarm1, alarm2]);
    }));

    it('should emit selected asset if it is provided to component as input', (done) => {
      // given
      component.assetSelection.subscribe((asset) => {
        expect(asset).toEqual({ id: 1 });
        done();
      });
      // when
      component.contextAsset = asset1;
      fixture.detectChanges();
    });
  });

  it('itemAdded', () => {
    // given
    jest.spyOn(component.selectionChange, 'emit');
    // when
    component.itemAdded(alarm1);
    // then
    expect(component.selectedItems.length).toBe(1);
    expect(component.selectedItems[0]).toEqual({ ...alarm1, __active: true });
    expect(component.selectionChange.emit).lastCalledWith([
      { ...alarm1, __active: true },
    ]);
  });

  it('itemRemoved', () => {
    // given
    component.itemAdded(alarm1);
    expect(component.selectedItems.length).toBe(1);
    jest.spyOn(component.selectionChange, 'emit');
    // when
    component.itemRemoved(alarm1);
    // then
    expect(component.selectedItems.length).toBe(0);
    expect(component.selectionChange.emit).lastCalledWith([]);
  });

  describe('assetSelectionChanged', () => {
    it('when single asset is provided', () => {
      // given
      const event1: AssetSelectionChangeEvent = {
        items: asset1,
        change: {} as any,
      };
      // when
      component.assetSelectionChanged(event1);
      // then
      expect(component.assetSelection.value).toBe(asset1);
    });

    it('when multiple assets are provided', () => {
      // given
      const event1: AssetSelectionChangeEvent = {
        items: [asset1, { id: 2 }],
        change: {} as any,
      };
      // when
      component.assetSelectionChanged(event1);
      // then
      expect(component.assetSelection.value).toBe(asset1);
    });

    it('when no assets are provided', (done) => {
      // given
      const event1: AssetSelectionChangeEvent = {
        items: [],
        change: {} as any,
      };
      component.assetSelection.subscribe((asset) => {
        expect(asset).toEqual(null);
        done();
      });
      // when
      component.assetSelectionChanged(event1);
    });
  });
});
