import { ExternalLinkIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { Button } from './ui/button'

export default function OpenRoomLink({ room_code }: { room_code: string }) {
  const router = useRouter()

  return (
    <Button
      type="submit"
      variant="outline"
      onClick={() => router.push(`/room/${room_code}`)}
    >
      <span className="sr-only">Link</span>
      <ExternalLinkIcon className="mr-2 h-4 w-4" />
      Open Link
    </Button>
  )
}
