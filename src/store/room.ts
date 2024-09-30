import { Room, RoomJoinedUser } from '@/types/database-extract-types'
import { create } from 'zustand'

interface previousRoomList extends Room {
  room_joined_users: RoomJoinedUser[]
}

interface RoomStore {
  previousRoomList: previousRoomList[] | undefined
  setPreviousRoomList: (roomList: previousRoomList[] | undefined) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  previousRoomList: [],
  setPreviousRoomList: (previousRoomList) => set({ previousRoomList }),
}))
