import { AddEquipmentForm } from '../components/add-equipment-form';

export default function AddEquipmentPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Equipment</h1>
        <p className="text-muted-foreground">
          Add new equipment to your clinic inventory
        </p>
      </div>
      
      <AddEquipmentForm />
    </div>
  );
}
