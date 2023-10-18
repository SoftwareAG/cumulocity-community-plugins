import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ExportCsvComponent } from './export-csv.component';

@Injectable({
  providedIn: 'root',
})
export class ExportCsvService {
  constructor(private bsModalService: BsModalService) {}

  async exportToCsv(csvData: unknown[][]) {
    const initialState: Pick<ExportCsvComponent, 'csvData'> = {
      csvData,
    };
    this.bsModalService.show(ExportCsvComponent, {
      class: 'modal-sm',
      ariaDescribedby: 'modal-body',
      ariaLabelledBy: 'modal-title',
      initialState: initialState,
      ignoreBackdropClick: true,
    });
  }
}
