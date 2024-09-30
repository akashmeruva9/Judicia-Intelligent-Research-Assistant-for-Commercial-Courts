import { createClient } from '@/utils/supabase/server'

export async function isRoomExists({
  room_code,
}: {
  room_code: string
}): Promise<boolean> {
  const supabase = createClient()

  const { data: chatRoomData, error: chatRoomError } = await supabase
    .from('rooms')
    .select(`room_code`)
    .eq('room_code', room_code)
    .single()

  if (chatRoomError) {
    throw new Error(`Error fetching chat room: ${chatRoomError.message}`)
  }

  return !chatRoomData ? false : true
}
