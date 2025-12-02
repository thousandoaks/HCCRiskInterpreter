import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HccAnalysisResult } from '../services/hcc-analyzer.service';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header / Summary Section -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-blue-600 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 class="text-white text-lg font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Clinical Interpretation Summary
          </h2>
          <div class="flex gap-2">
            @if (result().totalRafScore !== null) {
              <div class="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/30">
                RAF Score: {{ result().totalRafScore }}
              </div>
            }
            @if (result().estimatedMonthlyPayment) {
              <div class="bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/30 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ result().estimatedMonthlyPayment }}
              </div>
            }
          </div>
        </div>
        
        <!-- Patient Context Bar -->
        @if (result().patientDetails; as p) {
          <div class="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            @if (p.mrn) {
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">MRN:</span> 
                <span class="font-mono">{{ p.mrn }}</span>
              </div>
            }
            @if (p.dob) {
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">DOB:</span> 
                <span>{{ p.dob }}</span>
              </div>
            }
            @if (p.gender) {
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">Gender:</span> 
                <span>{{ p.gender }}</span>
              </div>
            }
            @if (!p.mrn && !p.dob && !p.gender) {
              <div class="italic text-slate-400">Patient demographics not found in report.</div>
            }
          </div>
        }

        <div class="p-6">
          <p class="text-slate-700 leading-relaxed text-lg">
            {{ result().patientSummary }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: Conditions -->
        <div class="lg:col-span-2 space-y-6">
          <h3 class="text-slate-800 font-bold text-xl flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Identified HCC Conditions
          </h3>
          
          <!-- Condition Summary Stats -->
          @if (conditionStats().count > 0) {
             <div class="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-lg p-4 shadow-sm">
                <div class="flex flex-wrap items-baseline gap-4 mb-3">
                    <div class="text-sm font-semibold text-slate-700">
                        Total Conditions: <span class="text-blue-700 text-lg font-bold ml-1">{{ conditionStats().count }}</span>
                    </div>
                    @if (conditionStats().totalWeight > 0) {
                        <div class="text-sm font-semibold text-slate-700 border-l border-slate-300 pl-4">
                            Combined Disease Weight: <span class="text-blue-700 text-lg font-bold ml-1">{{ conditionStats().formattedWeight }}</span>
                        </div>
                    }
                </div>
                
                @if (conditionStats().topConditions.length > 0) {
                    <div class="text-sm text-slate-600">
                        <span class="font-medium text-slate-800 block mb-2">Primary Risk Drivers:</span>
                        <div class="flex flex-wrap gap-2">
                            @for (c of conditionStats().topConditions; track c.code) {
                                <div class="bg-white border border-blue-200 text-slate-700 px-2 py-1.5 rounded-md shadow-sm flex items-center gap-2">
                                    <span class="font-bold text-blue-600 bg-blue-50 px-1 rounded text-xs">{{ c.code }}</span>
                                    <span class="truncate max-w-[180px] font-medium">{{ c.description }}</span>
                                    @if(c.weight) { <span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono">{{ c.weight }}</span> }
                                </div>
                            }
                        </div>
                    </div>
                }
             </div>
          }

          @if (result().conditions.length === 0) {
            <div class="p-4 bg-slate-100 rounded-lg text-slate-500 italic">
              No significant HCC conditions identified in report.
            </div>
          }

          <div class="space-y-4">
            @for (condition of result().conditions; track condition.code) {
              <div class="bg-white border-l-4 border-blue-500 rounded-r-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <span class="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                      {{ condition.code }}
                    </span>
                    <h4 class="text-lg font-semibold text-slate-900 mt-1">{{ condition.description }}</h4>
                  </div>
                  @if (condition.weight !== null) {
                    <span class="text-sm font-mono text-slate-400">Weight: {{ condition.weight }}</span>
                  }
                </div>
                <p class="text-slate-600 text-sm border-t border-slate-100 pt-2 mt-2">
                  <span class="font-semibold text-slate-700">Clinical Impact:</span> {{ condition.interpretation }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Recommendations & Gaps -->
        <div class="space-y-6">
          
          <!-- Recommendations -->
          <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
            <h3 class="text-emerald-800 font-bold text-lg mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Clinical Actions
            </h3>
            <ul class="space-y-2">
              @for (rec of result().clinicalRecommendations; track $index) {
                <li class="flex items-start gap-2 text-emerald-700 text-sm">
                  <span class="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>
                  {{ rec }}
                </li>
              }
              @if (result().clinicalRecommendations.length === 0) {
                <li class="text-emerald-600/60 italic text-sm">No specific actions found.</li>
              }
            </ul>
          </div>

          <!-- Documentation Gaps -->
          <div class="bg-amber-50 rounded-xl p-5 border border-amber-100">
            <h3 class="text-amber-800 font-bold text-lg mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Documentation Gaps
            </h3>
            <ul class="space-y-2">
              @for (gap of result().documentationGaps; track $index) {
                <li class="flex items-start gap-2 text-amber-700 text-sm">
                  <span class="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>
                  {{ gap }}
                </li>
              }
              @if (result().documentationGaps.length === 0) {
                <li class="text-amber-600/60 italic text-sm">No documentation gaps identified.</li>
              }
            </ul>
          </div>

          <button (click)="onReset.emit()" class="w-full py-3 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Analyze New Report
          </button>

        </div>
      </div>
    </div>
  `
})
export class ReportViewerComponent {
  result = input.required<HccAnalysisResult>();
  onReset = output<void>();

  conditionStats = computed(() => {
    const conditions = this.result().conditions;
    const count = conditions.length;
    
    // Sort conditions by weight descending (nulls treated as 0)
    const sorted = [...conditions].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    // Top 3 highest weighted conditions
    const topConditions = sorted.slice(0, 3);
    
    // Calculate total weight (sum of individual condition weights, not total RAF)
    const totalWeight = conditions.reduce((sum, c) => sum + (c.weight || 0), 0);

    return {
      count,
      topConditions,
      totalWeight,
      formattedWeight: totalWeight.toFixed(3)
    };
  });
}
