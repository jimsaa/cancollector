import { useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import { Heart, Plus, Database } from 'lucide-react'

import { Layout } from '../components/layout/Layout'

import { BrandFilter } from '../components/master/BrandFilter'

import { CanFormFields, emptyFormData, formDataToInsert } from '../components/cans/CanForm'

import { LoadingSpinner } from '../components/ui/LoadingSpinner'

import { EmptyState } from '../components/ui/EmptyState'

import { Button } from '../components/ui/Button'

import { Card } from '../components/ui/Card'

import { useAuth } from '../hooks/useAuth'

import { useCans } from '../hooks/useCans'

import type { MasterBrandFilter } from '../types/masterCan'

import type { WishlistStatus } from '../types/can'
import { applyWishlistStatusWithWanted } from '../lib/tradeFields'



export function WishlistPage() {

  const { storageUserId } = useAuth()

  const { cans, loading, error, add, update } = useCans(storageUserId)

  const [brand, setBrand] = useState<MasterBrandFilter>('all')

  const [filter, setFilter] = useState<'all' | WishlistStatus>('all')

  const [adding, setAdding] = useState(false)

  const [form, setForm] = useState(emptyFormData(true))

  const [saving, setSaving] = useState(false)



  const wishlist = useMemo(() => {

    let items = cans.filter((c) => c.is_wishlist)

    if (filter !== 'all') items = items.filter((c) => c.wishlist_status === filter)

    if (brand !== 'all') items = items.filter((c) => c.brand === brand)

    return items.sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())

  }, [cans, filter, brand])



  const handleAdd = async () => {

    setSaving(true)

    try {

      await add(formDataToInsert(form))

      setForm(emptyFormData(true))

      setAdding(false)

    } finally {

      setSaving(false)

    }

  }



  const toggleStatus = async (id: string, status: WishlistStatus) => {

    await update(id, applyWishlistStatusWithWanted(status))

  }



  return (

    <Layout title="Wishlist">

      <div className="flex flex-col gap-4">

        <p className="text-sm text-monster-muted">

          Cans you want to find. Items from the global database show a database badge.

        </p>



        <Link

          to="/missing"

          className="flex items-center gap-2 rounded-xl border border-monster-border bg-monster-card px-3 py-2 text-sm text-monster-green hover:border-monster-green/50"

        >

          <Database size={16} />

          Browse missing cans from global database

        </Link>



        <BrandFilter value={brand} onChange={setBrand} />



        <div className="flex gap-2">

          {(['all', 'wanted', 'missing'] as const).map((key) => (

            <button

              key={key}

              type="button"

              onClick={() => setFilter(key)}

              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium capitalize ${

                filter === key

                  ? 'border-monster-green bg-monster-green/20 text-monster-green'

                  : 'border-monster-border text-monster-muted'

              }`}

            >

              {key}

            </button>

          ))}

        </div>



        {!adding ? (

          <Button fullWidth variant="secondary" onClick={() => setAdding(true)}>

            <Plus size={18} />

            Add custom wishlist item

          </Button>

        ) : (

          <Card className="flex flex-col gap-4">

            <p className="text-sm font-semibold text-white">New wishlist item</p>

            <CanFormFields data={form} onChange={setForm} showWishlistFields />

            <div className="grid grid-cols-2 gap-2">

              <Button loading={saving} onClick={handleAdd}>Save</Button>

              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>

            </div>

          </Card>

        )}



        {loading ? (

          <LoadingSpinner label="Loading wishlist..." />

        ) : error ? (

          <EmptyState title="Error" description={error} />

        ) : wishlist.length === 0 ? (

          <EmptyState

            icon={<Heart size={40} />}

            title="Wishlist is empty"

            description="Mark missing cans as wanted from the global database, or add custom items."

            action={

              <Link to="/missing">

                <Button>Browse Missing Cans</Button>

              </Link>

            }

          />

        ) : (

          <div className="flex flex-col gap-3">

            {wishlist.map((can) => (

              <Card key={can.id} className="p-3 transition-colors hover:border-monster-green/40">

                <Link to={`/can/${can.id}`} className="mb-2 block">

                  <div className="flex items-start justify-between gap-2">

                    <div>

                      <div className="flex items-center gap-2">

                        <p className="font-semibold text-white">{can.name ?? 'Unknown'}</p>

                        {can.master_can_id ? (

                          <span className="rounded bg-monster-green/20 px-1.5 py-0.5 text-[10px] font-semibold text-monster-green">

                            Global DB

                          </span>

                        ) : null}

                      </div>

                      <p className="text-xs text-monster-muted">

                        {[can.brand, can.flavor, can.country, can.country_variant].filter(Boolean).join(' · ')}

                      </p>

                    </div>

                    <span className="text-xs text-monster-green">View</span>

                  </div>

                </Link>

                <div className="flex gap-2">

                  {(['wanted', 'missing'] as WishlistStatus[]).map((status) => (

                    <button

                      key={status}

                      type="button"

                      onClick={() => toggleStatus(can.id, status)}

                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize ${

                        can.wishlist_status === status

                          ? 'border-monster-green bg-monster-green/20 text-monster-green'

                          : 'border-monster-border text-monster-muted'

                      }`}

                    >

                      {status}

                    </button>

                  ))}

                </div>

              </Card>

            ))}

          </div>

        )}

      </div>

    </Layout>

  )

}


