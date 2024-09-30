import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"
import { Profile } from "@/types/database-extract-types";

export function useProfile(email: string) {
	const [profile, setProfile] = useState<Profile>()
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const supabase = createClient()
	useEffect(() => {
		if (isLoading) return
		const key = `profiles_${email}`
		const profile = localStorage.getItem(key)
		if (profile) {
			setProfile(JSON.parse(profile))
		} else {
			setIsLoading(true)
			supabase.from('profiles').select('*').eq('email', email).maybeSingle().then(({ data }) => {
				if (data) {
					setProfile(data)
					localStorage.setItem(key, JSON.stringify(data))
					setIsLoading(false)
				}
			})
		}
	}, [email, supabase, isLoading])
	const display_name = profile?.display_name || email.split('@')[0]
	const initials = display_name.toUpperCase().split(' ').filter(word => word).map(word => word[0]).join('')
	return { profile, display_name, initials }
}