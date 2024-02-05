import { createContext, useMemo } from 'react'
import type { ProviderProps, Provider } from 'react'

function MutableProvider<T extends {}>(this: Provider<T>, { value, children }: ProviderProps<T>) {
  const DefaultProvider = this
  const memoValue = useMemo(() => value, [])
  Object.assign(memoValue, value)
  return <DefaultProvider value={memoValue}>{children}</DefaultProvider>
}

export function createMutableContext<T extends {}>(defaultValue: T) {
  const ctx = createContext(defaultValue)
  const DefaultProvider = ctx.Provider
  // @ts-expect-error: 2352
  const bound = MutableProvider.bind(DefaultProvider) as Provider<T>
  ctx.Provider = bound
  return ctx
}
