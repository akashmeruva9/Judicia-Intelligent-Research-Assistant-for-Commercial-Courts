'use client'

import { CreateMediatorRoom } from '@/components/generate-room-code'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { IconPlus } from '@tabler/icons-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserDropdown } from './user-dropdown'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)

  return (
    <div className="fixed left-0 right-0 top-0 z-10 flex h-14 w-full items-center justify-center border-b border-gray-200 bg-white">
      <div className="flex h-full w-full items-center justify-between px-3 md:px-6">
        <div className="flex w-full items-center justify-start">
          <h4
            className="cursor-pointer text-2xl font-light"
            onClick={() => {
              router.push('/')
            }}
          >
            JUDICIA
          </h4>
        </div>
        <div className="flex w-full items-center justify-end space-x-4">
          {pathname === '/' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconPlus size={20} stroke={1.5} className="mr-2" />
                  Create Mediator Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                  <DialogTitle>Create a Mediator Room</DialogTitle>
                  <DialogDescription>
                    Create a room to mediate conversations between participants.
                  </DialogDescription>
                </DialogHeader>
                <CreateMediatorRoom open={open} setOpen={setOpen} />
              </DialogContent>
            </Dialog>
          )}
          <UserDropdown />
        </div>
      </div>
    </div>
  )
}
