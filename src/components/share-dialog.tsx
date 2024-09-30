'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/utils/supabase/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email(),
})

export const ShareDialog = ({
  roomCode,
  creatorEmail,
}: {
  roomCode: string
  creatorEmail: string
}) => {
  const [accessEmails, setAccessEmails] = useState<string[]>([])
  const { user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!dialogOpen) return

    const getAccessEmails = async () => {
      const { data: accessEmails, error: accessEmailsError } = await supabase
        .from('room_joined_users')
        .select('email')
        .eq('room_code', roomCode)

      if (accessEmailsError) {
        console.error('Error fetching access emails:', accessEmailsError)
        return
      }

      setAccessEmails(accessEmails.map((accessEmail) => accessEmail.email))
    }
    getAccessEmails()
  }, [dialogOpen, roomCode]) // eslint-disable-line

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { data: insertedData, error: insertError } = await supabase
      .from('room_joined_users')
      .insert({
        room_code: roomCode,
        email: values.email,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error inserting access email:', insertError)
      setError(
        "Either the user doesn't exist or has already been granted access",
      )
      return
    }

    setAccessEmails((prev) => [...prev, insertedData.email])

    form.reset()
    setError(null)
  }

  const deleteAccessEmail = async (email: string) => {
    const { error: deleteError } = await supabase
      .from('room_joined_users')
      .delete()
      .eq('room_code', roomCode)
      .eq('email', email)

    if (deleteError) {
      console.error('Error deleting access email:', deleteError)
      return
    }

    setAccessEmails((prev) =>
      prev.filter((accessEmail) => accessEmail !== email),
    )
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {creatorEmail === user?.email ? (
        <Button
          type="submit"
          size="sm"
          variant="outline"
          onClick={() => setDialogOpen(true)}
        >
          <Lock className="mr-2 h-4 w-4" />
          Share Access
        </Button>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Access</DialogTitle>
          <DialogDescription>
            Share this link with others to give them access to this room:
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-col">
          <h4 className="my-2 scroll-m-20 text-base font-semibold tracking-tight">
            Access granted to:
          </h4>

          <div>
            {accessEmails.map((email) => (
              <div key={email} className="flex items-center justify-between">
                <div className="text-sm">
                  {'-' + ' '}{' '}
                  {creatorEmail === email ? email + ' ' + '( You )' : email}
                </div>
                {creatorEmail === user?.email && email !== creatorEmail ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await deleteAccessEmail(email)
                    }}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="h-10 w-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
