import { AssetManager } from '../features/assets/AssetManager'

export function AssetsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Assets</h1>
      <AssetManager />
    </div>
  )
}