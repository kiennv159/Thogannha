import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  display_name: string;
  photo_url: string;
  role: 'customer' | 'worker';
  rating: number;
  review_count: number;
  services: string[];
  is_online: boolean;
  location: { lat: number, lng: number };
  bio: string;
}

export const supabaseService = {
  // --- Profiles ---
  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // --- Service Requests ---
  async createRequest(request: any) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([request]);
    if (error) throw error;
    return data;
  },

  async getNearbyWorkers(lat: number, lng: number, radiusKm: number = 5) {
    // Note: For real geo-queries in Supabase, you'd use PostGIS.
    // This is a simplified example.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .eq('is_online', true);
    
    if (error) throw error;
    return data as Profile[];
  },

  // --- Real-time Subscriptions ---
  subscribeToMessages(requestId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${requestId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `request_id=eq.${requestId}` 
      }, callback)
      .subscribe();
  }
};
