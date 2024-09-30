'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { isRoomExists } from './room-exists'

export async function verifyRoomMemberShip({ id }: { id: string }) {
  const supabase = createClient()

  try {
    if (!isRoomExists({ room_code: id })) {
      return redirect(`/not-found?error=Room not found`)
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (!user?.email) {
      throw new Error('User not found')
    }

    const { data: userRoomData } = await supabase
      .from('room_joined_users')
      .select(`email`)
      .eq('room_code', id)
      .eq('email', user.email)
      .single()

    if (!userRoomData) {
      throw new Error('You are not a member of this room')
    }
  } catch (error) {
    console.error(error)
    return redirect(`/not-found?error=${error}`)
  }
}
