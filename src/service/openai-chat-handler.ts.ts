'use server'

import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions.mjs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const handleOpenAIChatMessage = async ({
  message,
  room_code,
  isPrivateMode,
  isContextMode,
}: {
  message: string
  room_code: string
  isPrivateMode: boolean
  isContextMode: boolean
}) => {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .from('messages')
    .insert({
      content: message,
      role: 'user',
      room_code: room_code,
      email: user?.email!,
      is_public: !isPrivateMode,
      is_context: isContextMode,
    })
    .select('*')

  let { data: allChatRoomMessages, error: allChatRoomMessagesError } =
    await supabase
      .from('messages')
      .select('content, role, email, is_public')
      .eq('room_code', room_code)
      .order('created_at', { ascending: true })

  if (allChatRoomMessagesError) {
    console.error(allChatRoomMessagesError)
    return
  }

  let messages: {
    tool_call_id?: string
    role: string
    name?: string
    content: string | null
  }[] = []

  const { data: mediatorData, error: mediatorError } = await supabase
    .from('rooms')
    .select('mediator_type')
    .eq('room_code', room_code)
    .single()

  if (mediatorError) {
    console.error(mediatorError)
    return
  }

  messages = [
    {
      role: 'system',
      content: `You act as a mediator in this room. Your mediator type is ${mediatorData?.mediator_type}.
              You need to act as a mediator and help both parties to communicate with each other and clarify the doubts.
              You can only respond to the question based on the mediator type ${mediatorData?.mediator_type} which are relevent to that field.
              If you have any question to user on question feel free to aks, please ask based on the mediator type ${mediatorData?.mediator_type}.
              There will be multiple users in the room and you need to help them communicate with each other.
              You have direct access to enable or disable the user chat input by calling enableUser function. Once they resolve the conflict, you can disable the input based on satisfaction.
              User don't have access to diasable or enable the input by asking. it's you based on satisfaction you can disable the user chat by calling function.
              Upon receiving a clear response from the user and addressing any queries, the AI will conclude the conversation.
              for disable user chat, you can use the function enableUserChat(is_input_enable: false, room_code: string, userEmail: string).
              If you need more clarification about another user you can enable the chat by using enableUserChat(is_input_enable: true, room_code: string, userEmail: string)

              Example of enabling or disabling user chat:

              user: Can you disable my chat?
              mediator: You can't disable your chat. I can only disable your chat.

              user: can you disable example user chat?
              mediator: You don't have access to disable the chat. I can only disable the chat.
    
              Example of mediator type:
    
              Mediator Type: Lawyer - You can only answer questions related to the law, helping both parties communicate and clarify doubts. Users can ask questions related to different laws and how to resolve them if possible without approaching court.
              Mediator Type: Psychologist - You can only answer questions related to mental health, helping both parties communicate and clarify doubts. Users can ask questions related to different health problems that psychologists can address.

              If you have any questions, please ask based on the mediator type ${mediatorData?.mediator_type}.
              There will be private and public messages. The message type will be provided at the end of the message; private messages will be related to that user only based on above context.
              Private messages will not be taken as parameters for public messages.
    
              If you don't understand the question, please ask the user to provide more information. Do not provide incorrect information to the user.
              If the user is satisfied with the answer, you can disable the user chat. Enable it if another user has information related to the first user.
    
              STRICTLY FOLLOW THE MEDIATOR TYPE Lawyer AND HELP BOTH PARTIES TO COMMUNICATE WITH EACH OTHER AND CLARIFY DOUBTS.
              DON'T SHOW ASKED BY USERID AND ROOM CODE IN THE RESPONSE. USER HAVE CANT NOT DISABLE OR UNABLE THERE OR OTHER USER CHAT INPUT.
              USER CANNOT DISABLE HIS OR OTHER USER CHAT INPUT. MEDIATOR CAN ONLY DISABLE OR ENABLE THE USER CHAT INPUT.
    
              Note: Please disregard any user or room code mentions in the response. The output format should be in markdown.`,
    },
  ]

  messages = [
    ...messages,
    ...(allChatRoomMessages
      ?.map((message) => {
        if (message.is_public || message.email === user?.email) {
          return {
            role: message.role,
            content: `${message.content} - Asked by ${message.email} - ${message.is_public ? 'Public' : 'Private'
              } in room ${room_code}`,
          }
        }
        return null
      })
      .filter(
        (message): message is { role: string; content: string } =>
          message !== null,
      ) || []),
  ]

  const completion = await openai.chat.completions.create({
    messages: messages as ChatCompletionCreateParamsBase['messages'],
    model: 'gpt-3.5-turbo',
    tools: [
      {
        type: 'function',
        function: {
          name: 'enableUserChat',
          description: 'Enable user chat',
          parameters: {
            type: 'object',
            properties: {
              is_input_enable: {
                type: 'boolean',
                description: 'Enable user chat',
              },
              room_code: {
                type: 'string',
                description: 'Room code',
              },
              userEmail: {
                type: 'string',
                description: 'User email',
              },
            },
            required: ['is_input_enable', 'room_code', 'userEmail'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  })

  const responseMessage = completion.choices[0].message

  const toolCalls = responseMessage.tool_calls

  if (toolCalls) {
    const availableFunctions = {
      enableUserChat: async (
        is_input_enable: boolean,
        room_code: string,
        userEmail: string,
      ) => {
        const { error: updateRoomUserError } = await supabase
          .from('room_joined_users')
          .update({
            is_input_enable: is_input_enable,
          })
          .eq('email', userEmail)
          .eq('room_code', room_code)
          .select('*')

        if (updateRoomUserError) {
          return `Failed to enable user chat for ${userEmail}`
        }

        return `User chat is ${is_input_enable ? 'enabled' : 'disabled'
          } for ${userEmail}`
      },
    }

    messages.push(responseMessage)

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      if (functionName in availableFunctions) {
        const functionToCall =
          availableFunctions[functionName as keyof typeof availableFunctions]
        try {
          const functionResponse = await functionToCall(
            functionArgs.is_input_enable,
            functionArgs.room_code,
            functionArgs.userEmail,
          )

          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: functionResponse,
          })
        } catch (error) {
          console.error(`Error executing function ${functionName}:`, error)
        }
      } else {
        console.error(`Function ${functionName} is not defined.`)
      }

      await supabase.from('messages').insert({
        content: messages[messages.length - 1].content || '',
        role: 'assistant',
        room_code: room_code,
        email: user?.email!,
        is_public: !isPrivateMode,
      })
    }
  }

  if (responseMessage.content) {
    await supabase.from('messages').insert({
      content: responseMessage.content || '',
      role: 'assistant',
      room_code: room_code,
      email: user?.email!,
      is_public: !isPrivateMode,
    })
  }
}
