import { UserChatRooms } from '@/components/user-chat-rooms'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <UserChatRooms />
    </div>
  )
}
