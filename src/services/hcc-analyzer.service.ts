import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, SchemaType } from '@google/genai';

export interface PatientDetails {
  mrn: string | null;
  dob: string | null;
  gender: string | null;
}

export interface HccCondition {
  code: string;
  description: string;
  weight: number | null;
  interpretation: string;
}

export interface HccAnalysisResult {
  patientDetails: PatientDetails;
  patientSummary: string;
  totalRafScore: number | null;
  estimatedMonthlyPayment: string | null;
  conditions: HccCondition[];
  clinicalRecommendations: string[];
  documentationGaps: string[];
}

@Injectable({
  providedIn: 'root'
})
export class HccAnalyzerService {
  private ai: GoogleGenAI;

  constructor() {
    // Ideally this comes from a secure backend or environment, relying on process.env as per instructions
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async analyzeReport(reportText: string, financialText: string | null = null): Promise<HccAnalysisResult> {
    const modelId = 'gemini-3-pro-preview';

    const schema: SchemaType = {
      type: Type.OBJECT,
      properties: {
        patientDetails: {
          type: Type.OBJECT,
          properties: {
             mrn: { type: Type.STRING, nullable: true, description: "Medical Record Number if found in text." },
             dob: { type: Type.STRING, nullable: true, description: "Date of Birth if found in text." },
             gender: { type: Type.STRING, nullable: true, description: "Patient Gender if found in text." }
          }
        },
        patientSummary: {
          type: Type.STRING,
          description: "A concise summary of the patient's risk profile suitable for a physician."
        },
        totalRafScore: {
          type: Type.NUMBER,
          description: "The total Risk Adjustment Factor score if mentioned or calculated, otherwise null.",
          nullable: true
        },
        estimatedMonthlyPayment: {
          type: Type.STRING,
          description: "The estimated monthly payment amount if mentioned in the text (e.g. '$1,200'), otherwise null.",
          nullable: true
        },
        conditions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: "The HCC code (e.g., HCC19)." },
              description: { type: Type.STRING, description: "The name of the condition." },
              weight: { type: Type.NUMBER, description: "The risk weight associated if available.", nullable: true },
              interpretation: { type: Type.STRING, description: "Brief clinical significance of this finding." }
            },
            required: ["code", "description", "interpretation"]
          }
        },
        clinicalRecommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Actionable steps for the medical team."
        },
        documentationGaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Potential missing specificity or documentation improvements needed."
        }
      },
      required: ["patientDetails", "patientSummary", "conditions", "clinicalRecommendations", "documentationGaps"]
    };

    try {
      const response = await this.ai.models.generateContent({
        model: modelId,
        contents: [
          {
            role: 'user',
            parts: [{ text: `Analyze the following Risk Adjustment Factor (RAF) calculation/HCC report and optional financial data. 
            Act as a Senior HCC Coder and Medical Auditor. 
            Your goal is to translate this technical report into a human-friendly interpretation for doctors and nurses.
            Focus on clinical complexity, disease interactions, and documentation quality.
            
            INSTRUCTIONS:
            1. Extract patient demographics (MRN, DOB, Gender) from the text if available.
            2. Analyze the conditions and scores.
            3. If financial data is provided, extract the monthly payment and total RAF score if present.

            REPORT TEXT:
            ${reportText}

            ADDITIONAL FINANCIAL/SCORE DATA:
            ${financialText || 'None provided'}
            ` }]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          systemInstruction: "You are an expert Medical Risk Adjustment Auditor. Your output must be accurate, professional, and directly useful for clinical staff."
        }
      });

      const text = response.text;
      
      if (!text) {
        throw new Error('No response from AI');
      }
      return JSON.parse(text) as HccAnalysisResult;
    } catch (error) {
      console.error('Analysis failed', error);
      throw error;
    }
  }
}