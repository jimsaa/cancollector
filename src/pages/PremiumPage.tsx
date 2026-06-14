import { Crown, HardDrive } from 'lucide-react'

import { Layout } from '../components/layout/Layout'

import { Card } from '../components/ui/Card'



const PLANNED_FEATURES = [

  'Public collector profile',

  'Trade matching',

  'Wishlist sharing',

  'Collection value estimates',

  'Rare can alerts',

  'Advanced statistics',

]



export function PremiumPage() {

  return (

    <Layout title="Premium">

      <div className="flex flex-col gap-6">

        <div className="text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/20">

            <Crown size={32} className="text-yellow-400" />

          </div>

          <h1 className="text-2xl font-bold text-white">Premium</h1>

          <p className="mt-2 text-sm text-monster-muted">Coming soon</p>

        </div>



        <Card>

          <div className="mb-3 flex items-center gap-2">

            <HardDrive size={18} className="text-monster-green" />

            <h2 className="text-sm font-semibold text-white">Backup & Restore</h2>

          </div>

          <p className="text-sm text-monster-muted">

            Protect your collection if you change phone, clear browser data, or reinstall the app.

          </p>

          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-white">

            <li className="flex items-start gap-2">

              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-monster-green" />

              Export collection as JSON

            </li>

            <li className="flex items-start gap-2">

              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-monster-green" />

              Import and restore from backup files

            </li>

            <li className="flex items-start gap-2">

              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-monster-green" />

              Cloud backup snapshots (coming soon)

            </li>

          </ul>

        </Card>



        <Card>

          <p className="mb-4 text-sm text-monster-muted">

            Premium features are in development. Your account is already set up for upgrades when

            they launch.

          </p>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-monster-green">

            More planned features

          </h2>

          <ul className="flex flex-col gap-2">

            {PLANNED_FEATURES.map((feature) => (

              <li key={feature} className="flex items-start gap-2 text-sm text-white">

                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-monster-green" />

                {feature}

              </li>

            ))}

          </ul>

        </Card>

      </div>

    </Layout>

  )

}


