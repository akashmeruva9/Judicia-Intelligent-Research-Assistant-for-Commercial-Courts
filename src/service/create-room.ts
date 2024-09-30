'use server'

import { Room } from '@/types/database-extract-types'
import { createClient } from '@/utils/supabase/server'
import { customAlphabet } from 'nanoid'
import { initialiseRoom } from './osmobro'
import { z } from 'zod'

const ALPHABET: string =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ROOM_CODE_LENGTH: number = 13

const RoomInputSchema = z.object({
  mediator: z.string(),
  description: z.string(),
  parent_room_code: z.string().optional(),
  room_name: z.string().optional(),
  creator_email: z.string().email().optional(),
  participants: z.array(z.string()).optional().transform(val => val || []).optional()
})

export async function createRoom(params: z.infer<typeof RoomInputSchema>): Promise<string> {
  const nanoid = customAlphabet(ALPHABET, ROOM_CODE_LENGTH)
  const room_code = nanoid()

  const supabase = createClient()

  const creator_email = params.creator_email || (await supabase.auth.getUser()).data.user?.email;

  if (!creator_email) {
    throw new Error('User not found')
  }

  const objToInsert = {
    room_name: params.room_name,
    room_code,
    creator_email,
    mediator_type: params.mediator,
    parent_room_code: params.parent_room_code,
    description: params.description
  }

  console.log("CREATING ROOM", objToInsert, params)

  const { data: chatRoomData, error: chatRoomError } = await supabase
    .from('rooms')
    .insert(objToInsert)
    .select('*')
    .single()

  if (chatRoomError) {
    console.error(chatRoomError)
    throw new Error("Couldn't find room code")
  }

  const participants = new Set(params.participants)
  participants.add(creator_email)

  const { error: roomUserError } = await supabase
    .from('room_joined_users')
    .insert(Array.from(participants).map(participant => ({
      room_code: chatRoomData.room_code,
      email: participant,
    })))

  if (roomUserError) {
    throw new Error('Error adding user to room')
  }

  if (!chatRoomData.parent_room_code) {
    await createBreakoutRooms(chatRoomData.room_code)
  }

  return chatRoomData.room_code
}

export async function createBreakoutRooms(room_code: string) {
  const supabase = createClient()
  const { data: room } = await supabase.from('rooms').select().eq('room_code', room_code).maybeSingle()

  if (!room) throw new Error("Non-existent room!")

  const { data: room_joined_users } = await supabase.from('room_joined_users').select().eq('room_code', room_code)

  const breakout_room_codes = []

  for (const room_user of room_joined_users!) {
    const breakout_code = await createRoom({
      parent_room_code: room_code,
      room_name: `${room.room_name} - ${room_user.email}`,
      creator_email: room_user.email,
      mediator: room.mediator_type,
      description: room.description
    })
    breakout_room_codes.push(breakout_code)
  }
  for (const breakout_code of breakout_room_codes) {
    await initialiseRoom(breakout_code)
  }

  return breakout_room_codes
}

export async function getBreakoutRoom(parent_room_code: string): Promise<Room> {
  const supabase = createClient()
  const { data: room } = await supabase.from('rooms').select().eq('room_code', parent_room_code).maybeSingle()
  if (room?.parent_room_code) {
    return room!
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error("Not logged in!")
  const { data: breakout_room } = await supabase.from('rooms').select().eq('parent_room_code', parent_room_code).eq("creator_email", user?.email).maybeSingle()
  if (!breakout_room) {
    await createBreakoutRooms(parent_room_code)
    return getBreakoutRoom(parent_room_code)
  }
  return breakout_room!
}
