import { getBreakoutRoom } from "@/service/create-room"
import { useAuthStore } from "@/store/auth"
import { Room } from "@/types/database-extract-types"
import { createClient } from "@/utils/supabase/client"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function useRoom(roomCode: string) {
	const [room, setRoom] = useState<Room>()
	const supabase = createClient()
	const { user } = useAuthStore()
	useEffect(() => {
		supabase
			.from('rooms')
			.select(`*, room_joined_users!inner()`)
			.eq('room_joined_users.email', user?.email!)
			.eq('room_code', roomCode)
			.maybeSingle()
			.then(({ data }) => setRoom(data || undefined))

	}, [roomCode, supabase, user])
	return room
}

export function useParentRoomCode(roomCode: string) {
	const room = useRoom(roomCode)
	const [parentCode, setParentCode] = useState(roomCode)
	useEffect(() => {
		if (room) setParentCode(room.parent_room_code || room.room_code)
	}, [room])
	return parentCode
}

export function useRoomMode() {
	const params = useSearchParams()
	const [mode, setMode] = useState<string>()
	const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(params))
	useEffect(() => {
		setSearchParams(new URLSearchParams(params))
	}, [params])
	useEffect(() => {
		setMode(searchParams.get('mode') || undefined)
	}, [searchParams])
	function getModeURL(mode: string | null) {
		const url = new URL(window.location.href)
		if (mode) url.searchParams.set('mode', mode)
		else url.searchParams.delete('mode')
		return url.pathname + url.search
	}
	return { mode, getModeURL }
}

export function useRoomCode(): string {
	const { id } = useParams<{ id: string }>()
	const [roomCode, setRoomCode] = useState<string>(id)
	const { mode } = useRoomMode()
	useEffect(() => {
		switch (mode) {
			case 'breakout':
				getBreakoutRoom(id).then(breakout_room => {
					setRoomCode(breakout_room.room_code)
				})
				break
			default:
				setRoomCode(id)
		}
	}, [id, mode])
	return roomCode
}

export function useRoomStatus(roomCode: string) {
	const [status, setStatus] = useState<string>()
	const supabase = createClient()
	const { user } = useAuthStore()
	useEffect(() => {
		if (!(roomCode && user?.email)) return () => { }
		supabase.from('room_joined_users').select('*').eq('room_code', roomCode).eq('email', user?.email).maybeSingle().then(row => setStatus(row.data?.status))
		const channelName = `room_status_${roomCode}`
		supabase
			.channel(channelName)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'room_joined_users',
				},
				(payload) => {
					if (payload.new.room_code == roomCode && payload.new.email == user?.email) {
						setStatus(payload.new.status)
					}
				}
			)
			.subscribe()
		return () => supabase.channel(channelName).unsubscribe()
	}, [supabase, roomCode, user])
	return status
}