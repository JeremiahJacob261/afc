import Head from 'next/head'
import Link from 'next/link'

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white text-gray-900 px-6 py-10">
      <Head>
        <title>EFC Privacy Policy</title>
        <meta name="description" content="Privacy information for EFC accounts." />
      </Head>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-[#1BB6FF]">Back to EFC</Link>
        <h1 className="text-3xl font-black">Privacy Policy</h1>
        <p>
          EFC collects account information such as username, email address, phone number, country code, referral code,
          wallet activity, and authentication data so the service can create accounts, process account actions, and protect
          users from fraud or unauthorized access.
        </p>
        <p>
          Account data is stored with service providers used by the application, including Supabase for authentication and
          database services. Access to administrative tools should be limited to authorized staff only.
        </p>
        <p>
          Do not submit someone else&apos;s personal information. If you need account help or want your data reviewed,
          contact support through the official in-app support channel.
        </p>
        <p className="text-sm text-gray-500">Last updated: June 25, 2026</p>
      </div>
    </main>
  )
}
