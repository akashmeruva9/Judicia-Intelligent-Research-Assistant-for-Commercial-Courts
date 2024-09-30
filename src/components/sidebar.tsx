'use client'

import { useProfile } from '@/lib/hooks/profile'
import { useParentRoomCode, useRoomStatus } from '@/lib/hooks/room'
import { createClient } from '@/utils/supabase/client'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { LogOutIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'

function Participant(props: { email: string }) {
  const { profile, display_name, initials } = useProfile(props.email)
  return (
    <div
      className="flex w-full items-center justify-start"
      key={profile?.id || display_name}
    >
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="ml-2 flex flex-col items-start">
        <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
          {display_name}
        </p>
        <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
          {profile?.email}
        </p>
      </div>
    </div>
  )
}

function RoomStatus(props: { roomCode: string }) {
  const parentRoomCode = useParentRoomCode(props.roomCode)
  const roomStatus = useRoomStatus(parentRoomCode)
  const title = {
    in_caucus: 'Caucus',
    in_mediation: 'Mediation',
    awaiting_mediation: 'Waiting',
    resolved: 'Resolved',
  }[roomStatus!]
  const desc = {
    in_caucus:
      'Your representative will ask you questions to understand your perspective on the conflict.',
    in_mediation:
      'Your representative is presenting your case to the mediator. Please wait. You will recieve an update shortly.',
    awaiting_mediation:
      'Your representative has enough information for now. Mediation will start once all parties have briefed their representatives.',
    resolved:
      'An agreement has been made. You may reinitiate a conversation with your representative at any time.',
  }[roomStatus!]
  const classNames =
    {
      in_caucus: 'bg-blue-200 text-blue-900',
      in_mediation: 'bg-yellow-200 text-yellow-900',
      awaiting_mediation: 'bg-orange-200 text-orange-900',
      resolved: 'bg-green-200 text-green-900',
    }[roomStatus!] || ''
  if (!(roomStatus && title)) return null
  return (
    <div className={`m-2 max-w-full rounded-sm p-3 ${classNames}`}>
      <div className="text-md font-semibold">
        <div className="flex gap-2">
          <span className="py-1">
            <InfoCircledIcon />
          </span>
          {title}
        </div>
      </div>
      <div className="text-sm">{desc}</div>
    </div>
  )
}

export function Sidebar({ id }: { id: string }) {
  const supabase = createClient()

  const [roomInfo, setRoomInfo] = useState<{
    created_at: string
    creator_email: string
    id: string
    is_chat_ended: boolean
    mediator_type: string
    room_code: string
    updated_at: string | null
    parent_room_code: string | null
    room_joined_users: {
      email: string
      id: string
    }[]
  } | null>(null)

  // const { mode, getModeURL } = useRoomMode()
  const parent = useParentRoomCode(id)
  const isBreakout = false // && mode === 'breakout'

  useEffect(() => {
    const fetchRoomInfo = async () => {
      const { data: roomInfo, error: roomInfoError } = await supabase
        .from('rooms')
        .select('*, room_joined_users(id,email)')
        .eq('room_code', parent)
        .single()

      if (roomInfoError) {
        console.error('Error fetching room info:', roomInfoError)
        return
      }

      setRoomInfo(roomInfo)
    }
    fetchRoomInfo()
  }, [id]) // eslint-disable-line

  return (
    <div className="fixed bottom-0 left-0 top-14 z-10 flex h-full w-80 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3 font-medium text-gray-600">
        {isBreakout ? (
          <span>Breakout Room</span>
        ) : (
          <>
            <span>Participants</span>
            {/* <ShareDialog roomCode={id} creatorEmail={roomInfo?.creator_email!} /> */}
          </>
        )}
      </div>

      <div className="flex grow flex-col">
        {isBreakout ? (
          <div className="flex grow flex-col space-y-3 overflow-y-auto p-3">
            <p className="text-sm">
              Welcome to the breakout room! This space is designed for you to
              share your perspective with the mediator. Please provide accurate
              and detailed responses, as your input is crucial for a fair and
              effective mediation process. Thank you for your cooperation.
            </p>
          </div>
        ) : (
          <div className="flex grow flex-col space-y-3 overflow-y-auto p-3">
            {roomInfo?.room_joined_users.map(({ email, id }) => (
              <Participant email={email} key={id} />
            ))}
          </div>
        )}
        <RoomStatus roomCode={roomInfo?.room_code!} />
        <div className="mb-14 grid grid-flow-row gap-2 p-2">
          <Link href="/">
            <Button variant="destructive">
              <div className="grid grid-flow-col-dense text-ellipsis transition-all">
                <LogOutIcon className="mr-2 h-4 w-3" />
                Leave Room
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
