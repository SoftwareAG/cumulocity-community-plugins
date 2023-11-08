import { Component } from '@angular/core';
import {
  CommonModule,
  CoreModule,
  FormsModule,
  ModalModule,
} from '@c8y/ngx-components';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { CSVExportData } from './export-csv.model';

@Component({
  selector: 'c8y-export-csv',
  templateUrl: './export-csv.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalModule, CoreModule],
})
export class ExportCsvComponent {
  readonly defaultSeparator = ',';
  readonly defaultFilename = 'export';
  form = {
    fileName: this.defaultFilename,
    separator: this.defaultSeparator,
  };

  csvData: CSVExportData[];

  isLoading = false;

  constructor(public bsModalRef: BsModalRef) {}

  export() {
    this.isLoading = true;
    import('file-saver').then((fileSaver) => {
      for (const series of this.csvData) {
        const dataSet = series.data
          .map((value: string[]) => value.join(this.form.separator))
          .join('\n');
        const blob = new Blob([dataSet], { type: 'text/csv;charset=utf-8' });
        fileSaver.default.saveAs(blob, `${this.form.fileName}${series.id}.csv`);
      }

      this.isLoading = false;
      this.bsModalRef.hide();
    });
  }
}
