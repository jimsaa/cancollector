import { CheckCircle2, AlertTriangle, Database, Package, ArrowLeft, ArrowRight, Edit3 } from 'lucide-react'



import type { CanFormData } from '../cans/CanForm'



import {

  getApprovedMasterReferenceUrl,

  getDisplayImageUrl,

  getOffLookupPreviewUrl,

  IMAGE_SOURCE_LABELS,

} from '../../lib/canImage'



import type { MasterMatchKind, OffLookupStatus } from '../../lib/scanProductLookup'
import type { MatchConfidence } from '../../lib/masterCanProductMatch'



import type { MasterCan } from '../../types/masterCan'



import { Card } from '../ui/Card'



import { Button } from '../ui/Button'







export type { OffLookupStatus }







interface AddCanStepMatchProps {



  data: CanFormData



  offStatus: OffLookupStatus



  primarySource: 'master_database' | 'open_food_facts' | 'none'



  matchedMaster: MasterCan | null

  matchKind: MasterMatchKind

  matchConfidence: MatchConfidence | null

  possibleMaster: MasterCan | null

  possibleMasterScore: number | null

  declinedNameMatch: boolean

  onAcceptNameMatch: () => void

  onDeclineNameMatch: () => void



  onBack: () => void



  onContinue: () => void



  onEdit: () => void



}







function MetaItem({ label, value }: { label: string; value: string | null | undefined }) {



  if (!value) return null



  return (



    <div className="flex justify-between gap-4 border-b border-monster-border py-2.5 last:border-0">



      <span className="text-xs uppercase tracking-wide text-monster-muted">{label}</span>



      <span className="text-right text-sm text-white">{value}</span>



    </div>



  )



}







const offStatusCopy: Record<OffLookupStatus, { title: string; tone: 'success' | 'warning' | 'neutral' }> = {



  found: { title: 'Found on Open Food Facts (lookup only)', tone: 'success' },



  not_found: { title: 'Not in Open Food Facts', tone: 'warning' },



  error: { title: 'Could not reach Open Food Facts', tone: 'warning' },



  skipped: { title: 'Skipped — using master database match', tone: 'neutral' },



}







const primarySourceCopy: Record<AddCanStepMatchProps['primarySource'], string> = {



  master_database: 'Master database (verified reference)',



  open_food_facts: 'Open Food Facts (product data fallback)',



  none: 'Manual entry required',



}







export function AddCanStepMatch({



  data,



  offStatus,



  primarySource,



  matchedMaster,

  matchKind,

  matchConfidence,

  possibleMaster,

  possibleMasterScore,

  declinedNameMatch,

  onAcceptNameMatch,

  onDeclineNameMatch,



  onBack,



  onContinue,



  onEdit,



}: AddCanStepMatchProps) {



  const off = offStatusCopy[offStatus]



  const offPreview = getOffLookupPreviewUrl(data.off_image_url)

  const masterPreview = getApprovedMasterReferenceUrl({ master_image_url: data.master_image_url })

  const collectionPreview = getDisplayImageUrl(data)

  const showOffPreview = Boolean(offPreview) && offStatus === 'found'



  const hasProductData = Boolean(



    data.name || data.brand || data.flavor || data.volume || data.country || collectionPreview,



  )







  return (



    <div className="flex flex-col gap-4">



      <p className="text-sm text-monster-muted">



        We check the verified master database first. Open Food Facts helps fill product details but



        its images are only shown as a temporary lookup preview.



      </p>







      <div className="flex flex-col gap-2">



        <Card



          className={`flex items-start gap-3 p-3 ${



            matchedMaster



              ? 'border-monster-green/40 bg-monster-green/10'



              : 'border-monster-border bg-monster-card'



          }`}



        >



          <Database



            size={18}



            className={`mt-0.5 shrink-0 ${matchedMaster ? 'text-monster-green' : 'text-monster-muted'}`}



          />



          <div>



            <p className="text-sm font-semibold text-white">Master Database</p>



            <p className="text-xs text-monster-muted">



              {matchedMaster



                ? matchKind === 'product_name'
                  ? `Matched by product name: ${matchedMaster.product_name}`
                  : `Matched: ${matchedMaster.product_name}`



                : 'No verified master can for this barcode'}



            </p>



          </div>



        </Card>

        {matchedMaster && matchKind === 'product_name' ? (
          <span className="inline-flex w-fit items-center rounded-full bg-monster-green/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-monster-green">
            Matched by product name
          </span>
        ) : null}

        {!matchedMaster && possibleMaster && !declinedNameMatch && matchConfidence === 'medium' ? (
          <Card className="flex flex-col gap-3 border-yellow-600/40 bg-yellow-900/20 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-200">Possible Master Database match</p>
                <p className="text-xs text-yellow-100/80">
                  {possibleMaster.product_name}
                  {possibleMasterScore
                    ? ` (${Math.round(possibleMasterScore * 100)}% match, no barcode yet)`
                    : ' (no barcode yet)'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button className="py-2 text-xs" onClick={onAcceptNameMatch}>
                Use this match
              </Button>
              <Button variant="secondary" className="py-2 text-xs" onClick={onDeclineNameMatch}>
                Keep OFF data
              </Button>
            </div>
          </Card>
        ) : null}







        <Card



          className={`flex items-start gap-3 p-3 ${



            off.tone === 'success'



              ? 'border-monster-green/40 bg-monster-green/10'



              : off.tone === 'warning'



                ? 'border-yellow-600/40 bg-yellow-900/20'



                : 'border-monster-border bg-monster-card'



          }`}



        >



          {off.tone === 'success' ? (



            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-monster-green" />



          ) : off.tone === 'warning' ? (



            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />



          ) : (



            <Database size={18} className="mt-0.5 shrink-0 text-monster-muted" />



          )}



          <div>



            <p className="text-sm font-semibold text-white">Open Food Facts</p>



            <p className="text-xs text-monster-muted">{off.title}</p>



          </div>



        </Card>



      </div>







      {showOffPreview ? (



        <Card className="overflow-hidden border-yellow-600/30 bg-yellow-900/10 p-0">



          <div className="flex gap-4 p-4">



            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-monster-dark">



              <img



                src={offPreview!}



                alt="Open Food Facts lookup preview"



                className="h-full w-full object-contain p-1"



              />



              <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-yellow-300">



                OFF lookup



              </span>



            </div>



            <div className="min-w-0 flex-1">



              <p className="text-sm font-semibold text-yellow-200">Open Food Facts preview</p>



              <p className="mt-1 text-xs text-yellow-100/80">



                This image comes from Open Food Facts and may be inaccurate. Upload your own can



                photo for the best collection quality.



              </p>



            </div>



          </div>



        </Card>



      ) : null}







      <Card className="overflow-hidden p-0">



        <div className="flex gap-4 p-4">



          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-monster-dark">



            {collectionPreview ? (



              <img



                src={collectionPreview}



                alt={data.name || 'Product'}



                className="h-full w-full object-contain p-1"



              />



            ) : (



              <div className="flex h-full items-center justify-center">



                <Package size={32} className="text-monster-green/30" />



              </div>



            )}



            <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-monster-muted">



              {IMAGE_SOURCE_LABELS[data.image_source]}



            </span>



          </div>



          <div className="min-w-0 flex-1">



            <p className="text-lg font-bold leading-tight text-white">



              {data.name || 'Unknown product'}



            </p>



            {data.flavor ? (



              <p className="mt-0.5 text-sm text-monster-muted">{data.flavor}</p>



            ) : null}



            <p className="mt-2 font-mono text-xs text-monster-green">{data.barcode}</p>



            <p className="mt-1 text-[10px] text-monster-muted">{primarySourceCopy[primarySource]}</p>



            {masterPreview ? (



              <p className="mt-1 text-[10px] text-monster-green">Approved master reference available</p>



            ) : null}



            {!hasProductData ? (



              <p className="mt-2 text-xs text-yellow-400">



                Limited data found — you can fill in details on the next step.



              </p>



            ) : null}



          </div>



        </div>







        <div className="border-t border-monster-border px-4 pb-2">



          <MetaItem label="Brand" value={data.brand} />



          <MetaItem label="Volume" value={data.volume} />



          <MetaItem label="Country" value={data.country} />



          <MetaItem label="Collection image" value={IMAGE_SOURCE_LABELS[data.image_source]} />



        </div>



      </Card>







      <Button fullWidth onClick={onContinue} className="py-4">



        <ArrowRight size={20} />



        Continue



      </Button>







      <div className="grid grid-cols-2 gap-2">



        <Button variant="secondary" onClick={onBack}>



          <ArrowLeft size={18} />



          Back



        </Button>



        <Button variant="secondary" onClick={onEdit}>



          <Edit3 size={18} />



          Edit Details



        </Button>



      </div>



    </div>



  )



}




