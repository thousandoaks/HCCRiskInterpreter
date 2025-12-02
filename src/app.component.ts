import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HccAnalyzerService, HccAnalysisResult } from './services/hcc-analyzer.service';
import { ReportViewerComponent } from './components/report-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ReportViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html'
})
export class AppComponent {
  inputForm: FormGroup;
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  analysisResult = signal<HccAnalysisResult | null>(null);

  // Example placeholder report to help users understand what to paste
  placeholderText = `Risk Adjustment Factor Report
Patient: John Doe, DOB: 01/01/1950, Gender: M, MRN: 12345
...
HCC19 Diabetes without Complication - Weight 0.105
HCC111 Chronic Obstructive Pulmonary Disease - Weight 0.328
...
Total RAF: 1.25`;

  financialPlaceholder = `Example:
RAF Score: 1.250
Monthly Payment: $1,250.00
YTD Adjustment: $500.00`;

  constructor(
    private fb: FormBuilder,
    private hccService: HccAnalyzerService
  ) {
    this.inputForm = this.fb.group({
      reportText: ['', [Validators.required, Validators.minLength(10)]],
      financialText: ['']
    });
  }

  async onSubmit() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    
    const { reportText, financialText } = this.inputForm.value;

    try {
      const result = await this.hccService.analyzeReport(reportText, financialText);
      this.analysisResult.set(result);
    } catch (err: unknown) {
      console.error(err);
      this.error.set('Failed to interpret report. Please try again or check your API key.');
    } finally {
      this.isLoading.set(false);
    }
  }

  reset() {
    this.analysisResult.set(null);
    this.error.set(null);
    this.inputForm.reset();
  }
}