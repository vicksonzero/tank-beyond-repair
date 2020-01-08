// Immutable type definition by nieltg (https://github.com/nieltg)
// https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-402901005

type Primitive = undefined | null | boolean | string | number | Function

export type ShallowImmutable<T> =
    T extends Primitive ? T
    : T extends Array<infer U> ? ReadonlyArray<U>
    : T extends Map<infer K, infer V> ? ReadonlyMap<K, V>
    : Readonly<T>

export type Immutable<T> =
    T extends Primitive ? T
    : T extends Array<infer U> ? ImmutableArray<U>
    : T extends Map<infer K, infer V> ? ImmutableMap<K, V>
    : ImmutableObject<T>

interface ImmutableArray<T> extends ReadonlyArray<Immutable<T>> { }
interface ImmutableMap<K, V> extends ReadonlyMap<Immutable<K>, Immutable<V>> { }
type ImmutableObject<T> = {
    readonly [K in keyof T]: Immutable<T[K]>
}