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
import { Checkbox } from "@/components/ui/checkbox"
import { signIn } from "next-auth/react"
import { Sparkles } from "lucide-react"
import Image from "next/image"

const ERROR_MESSAGES: { [key: string]: string } = {
    'CredentialsSignin': 'Invalid email or password. Please try again.',
    'OAuthSignin': 'Error with OAuth sign in. Please try again.',
    'OAuthCallback': 'Error with OAuth callback. Please try again.',
    'OAuthCreateAccount': 'Could not create OAuth account. Please contact support.',
    'EmailCreateAccount': 'Could not create email account. Please contact support.',
    'Callback': 'Error during callback. Please try again.',
    'OAuthAccountNotLinked': 'This email is already associated with another account.',
    'EmailSignin': 'Error sending email. Please try again.',
    'SessionRequired': 'Please sign in to access this page.',
    'Default': 'An error occurred during sign in. Please try again.',
}

export default function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (error) {
            const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES['Default']
            toast.error(errorMessage)
            // Clean up the URL after showing the error
            router.replace('/login')
        }
    }, [error, router])

    async function loginWithCredentials(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            const formData = new FormData(e.currentTarget)
            const result = await signIn('credentials', {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                redirect: false,
            })

            if (result?.error) {
                const errorMessage = ERROR_MESSAGES[result.error] || ERROR_MESSAGES['Default']
                toast.error(errorMessage)
            } else if (result?.ok) {
                router.push('/')
            }
        } catch (error: any) {
            toast.error(error?.message || 'Login failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function loginWithGoogle() {
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
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue training models
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {/* Google Login Button */}
                        <Button 
                            variant="outline" 
                            type="button" 
                            className="w-full"
                            onClick={loginWithGoogle}
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
                        <form onSubmit={loginWithCredentials}>
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

                                {/* Remember Me Checkbox */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember" />
                                    <Label 
                                        htmlFor="remember" 
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Remember me for 30 days
                                    </Label>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                                </Button>
                            </div>
                        </form>

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <Link 
                                href="#" 
                                className="text-sm text-muted-foreground hover:text-primary underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                    
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="underline">
                            Click here to register
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}