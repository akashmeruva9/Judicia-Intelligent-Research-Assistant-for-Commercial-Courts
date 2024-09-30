import { Database } from '@/types/supabase'

type ExtractRowType<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row']

export type Profile = ExtractRowType<'profiles'>
export type Room = ExtractRowType<'rooms'>
export type RoomJoinedUser = ExtractRowType<'room_joined_users'>
export type Message = ExtractRowType<'messages'>
