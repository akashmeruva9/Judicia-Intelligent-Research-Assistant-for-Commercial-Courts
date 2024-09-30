'use server'

import { z } from 'zod'

const OSMOBRO_URL = z.string().parse(process.env.OSMOBRO_URL)

const MessageSchema = z.object({
  email: z.string().min(1).email(),
  content: z.string().min(1),
  room_code: z.string().min(1),
  role: z.string().min(1),
  is_public: z.boolean(),
  is_context: z.boolean()
})

type Message = z.infer<typeof MessageSchema>

export async function sendMessage(message: Message) {
  const messageBody: Message = MessageSchema.parse(message)

  console.log(JSON.stringify(messageBody))

  fetch(`${OSMOBRO_URL}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageBody),
  }).then(() => console.log("Sent message to osmobro."))
}

export async function initialiseRoom(roomCode: string) {
  await fetch(`${OSMOBRO_URL}/room/${roomCode}/initialise`, { method: 'POST' })
}

export async function syncContext(roomCode: string) {
  await fetch(`${OSMOBRO_URL}/room/${roomCode}/sync_context`, { method: 'POST' })
}
