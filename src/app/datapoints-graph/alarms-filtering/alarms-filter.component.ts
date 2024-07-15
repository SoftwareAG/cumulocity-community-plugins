import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  Severity,
  SeverityFilter,
  SEVERITY_LABELS,
  SeverityType,
} from '@c8y/client';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, startWith, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlarmCount,
  DEFAULT_ALARM_COUNTS,
  DEFAULT_SEVERITY_VALUES,
  FormFilters,
} from './alarms.model';

@Component({
  selector: 'c8y-alarms-filter',
  templateUrl: './alarms-filter.component.html',
})
export class AlarmsFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly severitiesList = Object.keys(SEVERITY_LABELS) as SeverityType[];

  @Input()
  contextSourceId: number | string | null = null;

  /**
   * EventEmitter to notify when filters have been applied.
   * Emits a `FormFilters` object representing the filter criteria applied by the user.
   */
  @Output()
  filterApplied = new EventEmitter<FormFilters>();

  @ViewChild('filtersDropdown')
  filtersDropdown: BsDropdownDirective | undefined;

  formGroup = this.formBuilder.group(DEFAULT_SEVERITY_VALUES);
  chips: SeverityType[] = [];
  countLoading: boolean = false;
  showCleared = true;
  alarmCounts: AlarmCount = DEFAULT_ALARM_COUNTS;
  shouldDisableApplyButton$: Observable<boolean> | undefined;
  isEachCheckboxSelected$: Observable<boolean> | undefined;
  protected readonly SEVERITY_LABELS = SEVERITY_LABELS;
  private isNoneCheckboxSelected$ = new BehaviorSubject<boolean>(false);
  private severitiesTouched$ = new BehaviorSubject<boolean>(false);
  private currentFormGroupValues = this.formGroup.value;
  private currentShowClearedValue: boolean = false;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.showCleared = params['showCleared'] === 'true';
        this.formGroup.setValue({
          [Severity.CRITICAL]: params[Severity.CRITICAL] === 'true',
          [Severity.MAJOR]: params[Severity.MAJOR] === 'true',
          [Severity.MINOR]: params[Severity.MINOR] === 'true',
          [Severity.WARNING]: params[Severity.WARNING] === 'true',
        });

        this.applyFilters(false);
      });
    this.trackCheckboxStateWithFormChanges();
    this.currentShowClearedValue = this.showCleared;
    this.updateChipsAndDefaultValues();
  }

  ngAfterViewInit(): void {
    this.filtersDropdown.isOpenChange.pipe(
      takeUntil(this.destroy$),
      filter(Boolean)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  allChanged(selected: boolean): void {
    this.formGroup.patchValue({
      [Severity.CRITICAL]: selected,
      [Severity.MAJOR]: selected,
      [Severity.MINOR]: selected,
      [Severity.WARNING]: selected,
    } as SeverityFilter);
  }

  applyFilters(navigate = true): void {
    this.updateChipsAndDefaultValues();
    const combinedFormEvent: FormFilters = {
      showCleared: this.showCleared,
      severityOptions: this.formGroup.value,
    };
    this.filterApplied.emit(combinedFormEvent);
    this.currentFormGroupValues = this.formGroup.value;
    this.currentShowClearedValue = this.showCleared;

    if (navigate) {
      this.router.navigate([], {
        queryParams: {
          showCleared: combinedFormEvent.showCleared,
          ...combinedFormEvent.severityOptions,
        },
      });
    }
  }

  deselectChip(chip: SeverityType): void {
    this.formGroup.patchValue({
      ...this.formGroup.value,
      [chip]: false,
    });
    this.applyFilters();
    this.closeDropdown();
  }

  closeDropdown(): void {
    if (this.filtersDropdown.isOpen) {
      this.filtersDropdown.isOpen = false;
    }
  }

  resetForm(): void {
    this.formGroup.reset(this.currentFormGroupValues);
    this.severitiesTouched$.next(false);
    this.showCleared = this.currentShowClearedValue;
  }

  markSeveritiesAsTouched(): void {
    this.severitiesTouched$.next(true);
  }

  private createFormValueWithChangesStream(): Observable<SeverityFilter> {
    return this.formGroup.valueChanges.pipe(startWith(this.formGroup.value));
  }

  private trackCheckboxStateWithFormChanges(): void {
    const formValue$ = this.createFormValueWithChangesStream();
    this.isEachCheckboxSelected$ = this.createAllSelectedStream(formValue$);
    this.trackAllCheckboxesDisabled(formValue$);
    this.shouldDisableApplyButton$ = this.createDisableApplyButtonStream();
  }

  private createAllSelectedStream(
    formValue$: Observable<SeverityFilter>
  ): Observable<boolean> {
    return formValue$.pipe(
      map((severities) => Object.values(severities).every(Boolean))
    );
  }

  private createIndeterminateStream(
    formValue$: Observable<SeverityFilter>
  ): Observable<boolean> {
    return formValue$.pipe(
      map(
        (severities) =>
          Object.values(severities).some(Boolean) &&
          !Object.values(severities).every(Boolean)
      )
    );
  }

  private trackAllCheckboxesDisabled(
    formValue$: Observable<SeverityFilter>
  ): void {
    formValue$.pipe(takeUntil(this.destroy$)).subscribe((severities) => {
      const areAllDisabled = Object.values(severities).every((value) => !value);
      this.isNoneCheckboxSelected$.next(areAllDisabled);
    });
  }

  private createDisableApplyButtonStream(): Observable<boolean> {
    return combineLatest([
      this.isNoneCheckboxSelected$,
      this.severitiesTouched$,
    ]).pipe(
      map(
        ([allCheckboxesAreDisabled, severitiesTouched]) =>
          allCheckboxesAreDisabled || !severitiesTouched
      )
    );
  }

  private updateChipsAndDefaultValues(): void {
    const severityFilter = this.formGroup;
    const seveerityValues = severityFilter.value;

    this.chips = Object.keys(seveerityValues).filter(
      (key) => seveerityValues[key]
    ) as SeverityType[];
    const allChipsRemoved = this.chips.length === 0;
    if (allChipsRemoved) {
      const defaultValues = DEFAULT_SEVERITY_VALUES;
      severityFilter.setValue(defaultValues);
      this.chips = Object.keys(defaultValues) as SeverityType[];
    }
  }
}
