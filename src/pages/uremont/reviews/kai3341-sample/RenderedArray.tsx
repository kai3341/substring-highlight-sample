import { FC } from 'react'
import { wrap as _wrap, toggle, bindCallables, HasWrapperGen } from '@wrap-mutant/react'

const changedFlsgSymbol = Symbol()
const renderedArraySymbol = Symbol()
const componentSymbol = Symbol()
const keyFNSymbol = Symbol()

type KeyFN<T> = (item: T) => string | number

type RenderedMixin<T> = {
  [changedFlsgSymbol]: boolean
  [renderedArraySymbol]: HasWrapperGen<Array<JSX.Element>>
  [componentSymbol]: FC<T>
  [keyFNSymbol]: KeyFN<T>
  render: () => HasWrapperGen<Array<JSX.Element | undefined>>
}

type RenderedArrayType<T> = RenderedMixin<T> & Array<T>

const numeric = /\d+/

const RenderedArrayHandler = {
  set<T extends {}>(target: RenderedArrayType<T>, property: keyof RenderedArrayType<T>, value: T, receiver: any) {
    if (typeof property === 'string' && property.match(numeric)) {
      const Component = target[componentSymbol]
      const inner = target[renderedArraySymbol]
      const keyFN = target[keyFNSymbol]
      // @ts-expect-error: 2540
      inner[property] = <Component {...value} key={keyFN(value)} />
      target[changedFlsgSymbol] = true
    }
    // @ts-expect-error: 2540
    target[property] = value
    return true
  },
  deleteProperty<T extends {}>(target: RenderedArrayType<T>, property: keyof RenderedArrayType<T>) {
    if (typeof property === 'string' && property.match(numeric)) {
      const inner = target[renderedArraySymbol]
      // @ts-expect-error: 2540
      delete inner[property]
      target[changedFlsgSymbol] = true
    }
    delete target[property]
    return true
  },
}

const methodCreators = {
  pushLike<T>(Base: ArrayConstructor, property: Exclude<keyof Array<T>, number>) {
    const Super = Base.prototype[property]
    return function <T>(this: RenderedArrayType<T>, ...items: T[]) {
      const Component = this[componentSymbol]
      const inner = this[renderedArraySymbol]
      const keyFN = this[keyFNSymbol]

      try {
        for (const props of items) {
          // @ts-expect-error: 2349
          Super.call(inner, <Component {...props} key={keyFN(props)} />)
          // @ts-expect-error: 2349
          Super.call(this, props)
        }

        return this.length
      } finally {
        this[changedFlsgSymbol] = true
      }
    }
  },

  spliceLike<T>(Base: ArrayConstructor, property: Exclude<keyof Array<T>, number>) {
    const Super = Base.prototype[property]
    return function <T>(this: RenderedArrayType<T>, ...args: any[]) {
      const inner = this[renderedArraySymbol]

      try {
        // @ts-expect-error: 2349
        Super.apply(inner, args)
        // @ts-expect-error: 2349
        return Super.apply(this, args)
      } finally {
        this[changedFlsgSymbol] = true
      }
    }
  },

  sortLike<T>(Base: ArrayConstructor, property: Exclude<keyof Array<T>, number>) {
    const Super = Base.prototype[property]
    return function <T>(this: RenderedArrayType<T>, callback: (item: T) => any) {
      const inner = this[renderedArraySymbol]

      try {
        // @ts-expect-error: 2349
        Super.call(inner, (rendered: JSX.Element) => callback(rendered.props))
        // @ts-expect-error: 2349
        return Super.call(this, callback)
      } finally {
        this[changedFlsgSymbol] = true
      }
    }
  },
}

const customArrayClasses = new Map<ArrayConstructor, ArrayConstructor & RenderedMixin<any>>()

interface RegisterCustomArrayOptions {
  [key: string]: string[]
}

export function registerCustomArray(Base: ArrayConstructor, options: RegisterCustomArrayOptions) {
  class CustomRenderedArray<T extends {}> extends Base implements RenderedMixin<T> {
    // @ts-expect-error: 2564
    [changedFlsgSymbol]: boolean;
    // @ts-expect-error: 2564
    [renderedArraySymbol]: HasWrapperGen<CustomRenderedArray<JSX.Element | undefined>>;
    // @ts-expect-error: 2564
    [componentSymbol]: FC<T>;
    // @ts-expect-error: 2564
    [keyFNSymbol]: KeyFN<T>

    render() {
      let rendered = this[renderedArraySymbol]

      if (this[changedFlsgSymbol]) {
        rendered = toggle(rendered)
        this[renderedArraySymbol] = rendered
        this[changedFlsgSymbol] = false
      }

      return rendered
    }
  }

  for (const [name, values] of Object.entries(options)) {
    for (const value of values) {
      const key = name as keyof typeof methodCreators
      const creator = methodCreators[key]
      // @ts-expect-error: 2345
      CustomRenderedArray.prototype[value] = creator(Base, value)
    }
  }

  // @ts-expect-error: 2345
  customArrayClasses.set(Base, CustomRenderedArray)
}

registerCustomArray(Array, {
  pushLike: ['push', 'unshift'],
  spliceLike: ['pop', 'shift', 'reverse', 'splice'],
  sortLike: ['sort'],
})

type RenderedArrayOptions<T> = {
  Component: FC<T>
  keyFunction: KeyFN<T>
  count?: number
  wrap?: boolean
  Base?: ArrayConstructor
}

export function RenderedArray<T extends {}>({
  Base = Array,
  Component,
  keyFunction,
  wrap = true,
  count,
}: RenderedArrayOptions<T>) {
  const CustomType = customArrayClasses.get(Base) as ArrayConstructor
  let renderedArray = new CustomType<T>() as RenderedArrayType<T>
  renderedArray[changedFlsgSymbol] = false
  renderedArray[renderedArraySymbol] = _wrap(bindCallables(new Base() as JSX.Element[]))
  renderedArray[componentSymbol] = Component
  renderedArray[keyFNSymbol] = keyFunction
  if (wrap) renderedArray = _wrap(bindCallables(renderedArray), count, RenderedArrayHandler)
  return renderedArray
}
