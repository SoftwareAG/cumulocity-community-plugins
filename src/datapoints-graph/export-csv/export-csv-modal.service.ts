import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ExportCsvComponent } from './export-csv.component';
import { EChartsOption } from 'echarts';
import { CSVExportData } from './export-csv.model';

@Injectable({
  providedIn: 'root',
})
export class ExportCsvService {
  constructor(private bsModalService: BsModalService) {}

  exportToCsv(chartOption: EChartsOption) {
    let series = chartOption.series;
    if (!Array.isArray(series)) {
      series = [series];
    }

    const csvData: CSVExportData[] = series
      .map(({ data, name, id }) => {
        return {
          name: name as string,
          data: data as string[][],
          id: id as string,
        };
      })
      .filter(Boolean);

    const initialState: Pick<ExportCsvComponent, 'csvData'> = {
      csvData,
    };
    this.bsModalService.show(ExportCsvComponent, {
      class: 'modal-sm',
      ariaDescribedby: 'modal-body',
      ariaLabelledBy: 'modal-title',
      initialState,
      ignoreBackdropClick: true,
    });
  }
}
