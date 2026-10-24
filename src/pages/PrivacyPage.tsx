import { Notice } from '../components/ui/Notice'

export function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <Notice tone="warning" title="Draft">
        This is a draft and needs legal review before any commercial use.
      </Notice>
      <h2 className="text-xl font-semibold">Right now</h2>
      <p>
        This preview site has no accounts, no uploads and no analytics. The sign-in and register
        forms do not send or store anything.
      </p>
      <h2 className="text-xl font-semibold">Planned</h2>
      <p>
        When accounts and uploads are added, this page will describe what is collected (such as
        email, uploaded files and basic usage events), where it is stored, and how to delete it.
      </p>
    </div>
  )
}