import { login, signup, signInWithGoogle } from './actions'
import { Chrome } from 'lucide-react'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error: string }>
}) {
    const { message, error } = await searchParams

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-3xl border border-border shadow-2xl backdrop-blur-sm">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <img src="/logo_fizenhive1.png" alt="FizenHive Logo" className="w-20 h-20 rounded-2xl shadow-lg object-cover" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Welcome to FizenHive
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sign in to access your portfolio and analysis
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <form className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-foreground mb-1">
                                    Email address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-border placeholder-muted-foreground text-foreground rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="name@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-border placeholder-muted-foreground text-foreground rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center font-medium animate-in fade-in zoom-in duration-300">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm text-center font-medium animate-in fade-in zoom-in duration-300">
                                {message}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                formAction={login}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-[0_0_20px_rgba(17,212,82,0.3)] hover:shadow-[0_0_25px_rgba(17,212,82,0.4)] active:scale-[0.98]"
                            >
                                Sign In
                            </button>
                            <button
                                type="submit"
                                formAction={signup}
                                className="group relative w-full flex justify-center py-3 px-4 border border-border text-sm font-bold rounded-xl text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none transition-all active:scale-[0.98]"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <form action={signInWithGoogle}>
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl border border-border bg-background shadow-sm text-sm font-bold text-foreground hover:bg-accent transition-all active:scale-[0.95]"
                            >
                                <Chrome className="mr-2 h-5 w-5 text-primary" />
                                <span>Continue with Google</span>
                            </button>
                        </form>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground px-4 leading-relaxed">
                    By clicking continue, you agree to our <span className="underline cursor-pointer hover:text-foreground">Terms of Service</span> and <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>.
                </p>
            </div>
        </div>
    )
}
