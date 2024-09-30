import { SubmitButton } from '@/components/auth-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const signIn = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect('/login?message=User not found or password is incorrect')
    }

    return redirect('/')
  }

  const signUp = async (formData: FormData) => {
    'use server'

    const origin = headers().get('origin')
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return redirect('/login?message=Could not authenticate user?type=error')
    }

    return redirect(
      '/login?message=Your account has been created successfully and Login to continue?type=success',
    )
  }

  return (
    <>
      <div className="container flex h-screen items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-10 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>

          <form>
            <div className="grid gap-5">
              <div className="grid gap-3">
                <Label className="sr-only" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  name="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                />

                <Label className="sr-only" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  name="password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  autoCorrect="off"
                />
              </div>
              <SubmitButton formAction={signIn}>Sign In</SubmitButton>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <SubmitButton formAction={signUp}>Sign Up</SubmitButton>
          </form>

          {searchParams?.message && (
            <>
              {searchParams.message.includes('success') ? (
                <div className="text-center text-sm text-green-500">
                  {searchParams.message.split('?')[0]}
                </div>
              ) : (
                <div className="text-center text-sm text-red-500">
                  {searchParams.message.split('?')[0]}
                </div>
              )}
            </>
          )}

          <p className="text-center text-base text-muted-foreground">
            By continuing, you are indicating that you accept our Terms of
            Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  )
}
