'use client'

import { Button } from '@/components/ui/button'
import { sendMessage } from '@/service/osmobro'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/utils/supabase/client'
import { IconMicrophone, IconPhoto, IconSend2 } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

export const RoomChatPromptInput = ({ roomCode }: { roomCode: string }) => {
  const [isInputDisabled, setIsInputDisabled] = useState(false)
  const { user } = useAuthStore()

  const [inputValue, setInputValue] = useState('')
  const [isPrivateMode, setIsPrivateMode] = useState(true)
  const [isContextMode, setIsContextMode] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!user) return () => {}

    const checkIfUserChatIsEnable = async () => {
      const { data: roomUserData, error: roomUserError } = await supabase
        .from('room_joined_users')
        .select(`is_input_enable`)
        .eq('room_code', roomCode)
        .eq('email', user?.email!)
        .single()

      if (roomUserError) {
        console.error('Error: ', roomUserError)
      }

      if (roomUserData) {
        setIsInputDisabled(!roomUserData.is_input_enable)
      }
    }

    supabase
      .channel('room_joined_users_enabled')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_joined_users' },
        (payload) => {
          setIsInputDisabled(!payload.new.is_input_enable)
        },
      )
      .subscribe()

    checkIfUserChatIsEnable()
    return () => supabase.channel('room_joined_users_enabled').unsubscribe()
  }, [roomCode, user?.email]) // eslint-disable-line

  const handleSendMessage = async () => {
    if (inputValue === '') return
    await sendMessage({
      content: inputValue,
      room_code: roomCode,
      email: user?.email!,
      role: 'user',
      is_public: !isPrivateMode,
      is_context: isContextMode,
    })
    setInputValue('')
  }

  // on enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <label className="relative">
      <TextareaAutosize
        minRows={2}
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex w-full resize-none rounded-xl border border-input bg-background px-3 py-2 pr-96 shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="absolute bottom-3 right-2 z-10 flex space-x-4 bg-white">
        {/* Image Icon */}
        <Button variant="outline" size="icon">
          <IconPhoto stroke={1.5} className="h-5 w-5" />
        </Button>

        {/* Mic Icon */}
        <Button variant="outline" size="icon">
          <IconMicrophone stroke={1.5} className="h-5 w-5" />
        </Button>

        {/* Send Button */}
        <Button variant="outline" onClick={handleSendMessage} size="icon">
          <IconSend2 stroke={1.5} className="h-5 w-5" />
        </Button>
      </div>
    </label>
  )
}
