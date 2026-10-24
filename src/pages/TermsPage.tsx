import { Notice } from '../components/ui/Notice'

export function TermsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <Notice tone="warning" title="Draft">
        This is a draft and needs legal review before any commercial use.
      </Notice>
      <p>
        Plinkmind AR Studio is in development. The full terms will cover use of the service,
        accounts, uploaded content, acceptable use, availability and liability. They will be
        written and reviewed before the product is offered to customers.
      </p>
    </div>
  )
}