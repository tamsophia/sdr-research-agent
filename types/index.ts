export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_title: string;
  company_domain: string;
  headcount: string;
  estimated_tenure: string;
}

export type LeadStatus =
  | "pending"
  | "running"
  | "disqualified"
  | "completed"
  | "error";

export interface ProgressEvent {
  type: "progress" | "complete" | "error" | "disqualified";
  leadId: string;
  step?: string;
  message?: string;
  brief?: Brief;
  disqualifyReason?: string;
}

export interface Brief {
  company: string;
  contact: string;
  title: string;
  hypothesis: string;
  buying_pattern: string;
  evidence: string[];
  opening_question: string;
  red_flags: string[];
  fact_check_score: number;
  fact_check_notes: string;
  generated_at: string;
}

export interface LeadResult {
  lead: Lead;
  status: LeadStatus;
  brief?: Brief;
  disqualifyReason?: string;
  error?: string;
  steps: string[];
}
