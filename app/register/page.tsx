"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { Sparkles } from "lucide-react"
import Image from "next/image"
import { registerWithCredentials } from "@/app/actions/registration-actions"

export default function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (error) {
            toast.error(error)
            // Clean up the URL after showing the error
            router.replace('/register')
        }
    }, [error, router])

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            const formData = new FormData(e.currentTarget)
            await registerWithCredentials(formData)
        } catch (error: any) {
            // Re-throw NEXT_REDIRECT errors so Next.js can handle the redirect
            if (error?.message?.includes('NEXT_REDIRECT')) {
                throw error;
            }
            // Handle any other errors
            toast.error(error?.message || 'Registration failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleGoogleSignup() {
        await signIn("google", { callbackUrl: "/" })
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* DiffusionLab Branding */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-600">DiffusionLab</span>
            </div>

            <Card className="mx-auto w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an Account</CardTitle>
                    <CardDescription>
                        Sign up to start training your models
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {/* Google Registration Button */}
                        <Button 
                            variant="outline" 
                            type="button" 
                            className="w-full"
                            onClick={handleGoogleSignup}
                        >
                            <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-2" />
                            Continue with Google
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleRegister}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="username"
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        name="password" 
                                        placeholder="Enter your password"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
