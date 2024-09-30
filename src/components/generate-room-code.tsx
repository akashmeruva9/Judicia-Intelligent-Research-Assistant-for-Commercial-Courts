'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createRoom } from '@/service/create-room'
import { zodResolver } from '@hookform/resolvers/zod'
import { ReloadIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Textarea } from './ui/textarea'

const FormSchema = z.object({
  room_name: z.string(),
  mediator: z.string(),
  description: z.string(),
  participants: z
    .string()
    .transform((val) =>
      val.split(',').map((e) => z.string().email().parse(e.trim())),
    ),
})

export const CreateMediatorRoom = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const [roomCode, setRoomCode] = useState<string>('')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const generateCode = async (data: z.infer<typeof FormSchema>) => {
    console.log('Generating code...')
    setLoading(true)

    try {
      const room = await createRoom({
        mediator: data.mediator,
        participants: data.participants,
        description: data.description,
        room_name: data.room_name,
      })
      setRoomCode(room)
      setLoading(false)
      setOpen(false)
      router.refresh()
      return
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4 space-y-5">
        <div className="text-md flex">
          <Form {...form}>
            <form
              className="w-full space-y-4"
              onSubmit={form.handleSubmit(generateCode)}
            >
              <FormField
                control={form.control}
                name="room_name"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>
                        Room Name{' '}
                        <span className="text-gray-400">(Optional)</span>
                      </FormLabel>
                      <FormDescription>
                        Please enter a name for the room.
                      </FormDescription>
                      <Input
                        onChange={field.onChange}
                        defaultValue={field.value}
                      />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="mediator"
                render={({ field }) => (
                  <FormItem className="w-fit">
                    <FormLabel>Mediator Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a mediator type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lawyer">Business related</SelectItem>
                        <SelectItem value="psychologist">
                          Finance related
                        </SelectItem>
                        <SelectItem value="HR">Patent related</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a mediator type to display in the room.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Participants</FormLabel>
                      <FormDescription>
                        Please enter the participant e-mail addresses separated
                        by commas (,)
                      </FormDescription>
                      <Textarea
                        onChange={field.onChange}
                        defaultValue={field.value}
                      />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormDescription>
                        Please briefly describe the conflict to be resolved and
                        the parties involved.
                      </FormDescription>
                      <Textarea
                        onChange={field.onChange}
                        defaultValue={field.value}
                      />
                    </FormItem>
                  )
                }}
              />
              <Button
                className="w-fit"
                variant="default"
                disabled={loading}
                type="submit"
              >
                {loading && !roomCode ? (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {roomCode ? 'Creating Room' : 'Create a room'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}
