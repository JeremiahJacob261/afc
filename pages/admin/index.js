import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Shield, ArrowRight, ArrowLeft, User, Lock } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!username || !password) {
      alert('Please enter your admin credentials')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        alert(result.message || 'login failed')
        return
      }

      alert('login successful')
      router.push(typeof router.query.next === 'string' ? router.query.next : '/admin/home')
    } catch (error) {
      console.log(error)
      alert('login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0f3c63_0%,rgba(15,60,99,0.35)_24%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(27,182,255,0.18),transparent_30%)]" />

        <header className="relative z-10 px-6 py-6 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </header>

        <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              <section className="flex flex-col justify-between border-b border-white/10 bg-slate-900/70 p-8 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="space-y-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                    <Shield className="h-6 w-6" />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      Admin Portal
                    </p>
                    <h1 className="max-w-md text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      Secure access for platform operations
                    </h1>
                    <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                      Use your admin credentials to manage activity, finances, matches, and account controls from one place.
                    </p>
                  </div>
                </div>

                <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    Match controls
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    Finance actions
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    User oversight
                  </div>
                </div>
              </section>

              <section className="bg-white p-8 text-slate-900 sm:p-10">
                <div className="mx-auto w-full max-w-sm">
                  <div className="mb-8">
                    <p className="text-sm font-medium text-slate-500">Welcome back</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">Sign in to admin</h2>
                  </div>

                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      login()
                    }}
                  >
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">Username</span>
                      <span className="relative block">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Enter admin username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        />
                      </span>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">Password</span>
                      <span className="relative block">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        />
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500 hover:text-slate-950"
                    >
                      {loading ? 'Signing in...' : 'Login'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
