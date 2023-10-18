import { Component } from '@angular/core';
import {
  CommonModule,
  CoreModule,
  FormsModule,
  ModalModule,
} from '@c8y/ngx-components';
import { BsModalRef } from 'ngx-bootstrap/modal';

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

  csvData: unknown[][];

  isLoading = false;

  constructor(public bsModalRef: BsModalRef) {}

  export() {
    this.isLoading = true;
    const csvString = this.csvData
      .map((series) =>
        series.map((value: any[]) => value.join(this.form.separator)).join('\n')
      )
      .join('\n\n');

    import('file-saver').then((fileSaver) => {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
      fileSaver.default.saveAs(blob, `${this.form.fileName}.csv`);
      this.isLoading = false;
      this.bsModalRef.hide();
    });
  }
}
