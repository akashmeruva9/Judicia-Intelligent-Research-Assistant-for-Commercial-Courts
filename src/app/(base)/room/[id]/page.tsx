'use client'

import { LoadingSpinner } from '@/components/loading-spinner'
import { MessageMarkdown } from '@/components/message-markdown'
import { RoomChatPromptInput } from '@/components/prompt-input'
import { Sidebar } from '@/components/sidebar'
import { useRoomCode } from '@/lib/hooks/room'
import { verifyRoomMemberShip } from '@/service/verify-room-membership'
import { useAuthStore } from '@/store/auth'
import { Message } from '@/types/database-extract-types'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ChatRoomPage() {
  const router = useRouter()
  const id = useRoomCode()
  const { user } = useAuthStore()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[] | null>([])

  useEffect(() => {
    if (!id && typeof id !== 'string') {
      router.push('/not-found?error=Room code not found')
    }

    verifyRoomMemberShip({ id })
  }, [id, router])

  useEffect(() => {
    if (!user) return

    const fetchMessages = async () => {
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_code', id)
        .order('created_at', { ascending: true })

      if (messageError) {
        console.error('Error fetching messages', messageError)
      }

      setMessages(messageData)
    }

    fetchMessages()
  }, [id, user?.email]) // eslint-disable-line

  useEffect(() => {
    if (!user) return () => { }

    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.room_code === id) {
            setMessages((prev) => [...(prev as any), payload.new])
          }
        },
      )
      .subscribe()
    return () => supabase.channel('messages').unsubscribe()
  }, [id, user?.email]) // eslint-disable-line

  useEffect(() => {
    document.querySelector('.message:last-child')?.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  }, [messages, id])

  const isDebugMode = !!useSearchParams().has('debug')

  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex h-full">
      <Sidebar id={id} />
      <div className="relative ml-80 h-[calc(100vh-3.5rem)] w-full ">
        <div className="h-full w-full overflow-y-scroll pb-20">
          <div className="mx-auto space-y-3">
            {messages?.filter(message => !(!isDebugMode && message.role === 'system'))?.map((message) => (
              <div key={message.id} className="bg-gray-50 py-10 message">
                <div className="mx-auto max-w-2xl">
                  <MessageMarkdown
                    content={message.content || ''}
                    role={message.role}
                    email={message.email}
                    createdAt={message.created_at}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 w-full border-t bg-white p-4">
          <RoomChatPromptInput roomCode={id} />
        </div>
      </div>
    </div>
  )
}
