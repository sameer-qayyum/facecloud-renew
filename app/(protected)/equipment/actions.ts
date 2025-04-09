'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Toggle the availability status of equipment
 * @param equipmentId - The ID of the equipment to update
 * @returns Object indicating success or failure
 */
export async function toggleEquipmentAvailability(equipmentId: string) {
  try {
    const supabase = await createClient();
    
    // First get the current status
    const { data: equipment, error: fetchError } = await supabase
      .from('equipment')
      .select('active')
      .eq('id', equipmentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching equipment:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Toggle the active status
    const { error: updateError } = await supabase
      .from('equipment')
      .update({ active: !equipment.active })
      .eq('id', equipmentId);
    
    if (updateError) {
      console.error('Error updating equipment status:', updateError);
      return { success: false, error: updateError.message };
    }
    
    // Revalidate the equipment page to reflect changes
    revalidatePath('/equipment');
    
    return { 
      success: true, 
      newStatus: !equipment.active,
      message: !equipment.active ? 'Equipment marked as available' : 'Equipment marked as unavailable'
    };
  } catch (error) {
    console.error('Unexpected error in toggleEquipmentAvailability:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a new equipment item
 * @param data - The equipment data containing name, quantity, and clinic_id
 * @returns Object indicating success or failure
 */
export async function createEquipment(data: { 
  name: string; 
  quantity: number; 
  clinic_id: string;
}) {
  try {
    const supabase = await createClient();
    
    // Insert the new equipment
    const { data: newEquipment, error } = await supabase
      .from('equipment')
      .insert({
        name: data.name,
        quantity: data.quantity,
        clinic_id: data.clinic_id,
        active: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating equipment:', error);
      return { success: false, error: error.message };
    }
    
    // Revalidate the equipment page to reflect changes
    revalidatePath('/equipment');
    
    return { 
      success: true, 
      equipmentId: newEquipment.id,
      message: 'Equipment created successfully'
    };
  } catch (error) {
    console.error('Unexpected error in createEquipment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
