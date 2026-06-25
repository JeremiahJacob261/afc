import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <main className="min-h-screen bg-white text-gray-900 px-6 py-10">
      <Head>
        <title>EFC Terms</title>
        <meta name="description" content="Terms for using EFC." />
      </Head>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-[#1BB6FF]">Back to EFC</Link>
        <h1 className="text-3xl font-black">Terms</h1>
        <p>
          EFC accounts are for adults who are legally allowed to use football market and wallet services in their location.
          Do not create an account if you are under 18 or if this service is restricted where you live.
        </p>
        <p>
          You are responsible for keeping your login details private, using accurate account information, and understanding
          the risks before adding funds or placing any market entry. EFC does not ask for your password outside this website.
        </p>
        <p>
          Promotions, bonuses, withdrawals, and account access may be limited by verification, fraud prevention, local law,
          and platform rules. If you believe a page, message, or link is suspicious, stop and contact support through the
          official in-app support channel.
        </p>
        <p className="text-sm text-gray-500">Last updated: June 25, 2026</p>
      </div>
    </main>
  )
}
