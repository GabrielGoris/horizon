import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_PAGE_SIZE = 30

type InfiniteListOptions = {
  hasMore?: boolean
  onLoadMore?: () => void
}

export function useInfiniteList<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE, options?: InfiniteListOptions) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onLoadMore = options?.onLoadMore
  const isRemoteList = Boolean(onLoadMore)
  const hasMore = isRemoteList ? Boolean(options?.hasMore) : visibleCount < items.length

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return
    const scrollRoot = sentinel.closest('main')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (isRemoteList) {
            onLoadMore?.()
          } else {
            setVisibleCount((current) => Math.min(current + pageSize, items.length))
          }
        }
      },
      { root: scrollRoot, rootMargin: '360px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isRemoteList, items.length, onLoadMore, pageSize, visibleCount])

  return {
    hasMore,
    sentinelRef,
    visibleItems: useMemo(() => isRemoteList ? items : items.slice(0, visibleCount), [isRemoteList, items, visibleCount]),
  }
}
