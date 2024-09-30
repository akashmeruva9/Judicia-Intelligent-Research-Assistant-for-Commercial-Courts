import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@/lib/hooks/profile'
import { formatDate } from '@/utils/format-date'
import { marked } from 'marked'
import { FC } from 'react'

interface MessageMarkdownProps {
  content: string
  role: string
  email: string
  createdAt: string
}

export const MessageMarkdown: FC<MessageMarkdownProps> = ({
  content,
  role,
  email,
  createdAt,
}) => {
  const { display_name, initials } = useProfile(email)
  const name = { assistant: 'AI', system: 'System', mediator: 'Mediator', representative: `${display_name}'s Representative` }[role] || display_name
  const avatarFallback = { Assistant: 'AI', System: 'SY', Mediator: 'M' }[name] || initials
  return (
    <div className="flex flex-col items-start gap-x-5">
      <div className="flex w-full items-center justify-start gap-x-4">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback className={{user: 'bg-gray-200', representative: 'text-white bg-gray-500'}[role]}>
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
            {name}
          </p>
          <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
            {formatDate(new Date(createdAt))}
          </p>
        </div>
      </div>
      <div className="prose prose-base mt-3 w-full prose-h1:text-xl prose-h1:font-semibold prose-h1:tracking-tight prose-h2:mt-4 prose-h2:text-lg prose-h2:font-semibold prose-p:mt-4 prose-p:pr-12 prose-p:text-justify prose-p:text-base prose-p:text-gray-800 prose-a:text-primary prose-a:hover:underline">
        <div dangerouslySetInnerHTML={{ __html: marked(content) }} />
      </div>
    </div>
  )
}
