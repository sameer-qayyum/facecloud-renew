// Components
export { ClinicSelector } from './components/clinic-selector';
export { FormCard } from './components/form-card';
export { FormActions } from './components/form-actions';

// Hooks
export { useCompanyData } from './hooks/use-company-data';

// Re-export common types
export interface Clinic {
  id: string;
  name: string;
  location_name?: string | null;
}
