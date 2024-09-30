'use server'

import { createClient } from '@/utils/supabase/server'

export const roomParticipants = async ({ roomCode }: { roomCode: string }) => {
  const supabase = createClient()

  const { data: profilesData, error } = await supabase
    .from('profiles')
    .select('email, room_joined_users(*)')
    .eq('room_joined_users.room_code', roomCode)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  return profilesData
}
