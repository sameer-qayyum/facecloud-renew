'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Toggle the availability status of a room
 * @param roomId - The ID of the room to update
 * @returns Object indicating success or failure
 */
export async function toggleRoomAvailability(roomId: string) {
  try {
    const supabase = await createClient();
    
    // First get the current status
    const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('active')
      .eq('id', roomId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching room:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Toggle the active status
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ active: !room.active })
      .eq('id', roomId);
    
    if (updateError) {
      console.error('Error updating room status:', updateError);
      return { success: false, error: updateError.message };
    }
    
    // Revalidate the rooms page to reflect changes
    revalidatePath('/rooms');
    
    return { 
      success: true, 
      newStatus: !room.active,
      message: !room.active ? 'Room marked as available' : 'Room marked as unavailable'
    };
  } catch (error) {
    console.error('Unexpected error in toggleRoomAvailability:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
