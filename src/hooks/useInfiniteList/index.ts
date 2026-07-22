import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_PAGE_SIZE = 30

export function useInfiniteList<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || visibleCount >= items.length) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(current + pageSize, items.length))
        }
      },
      { rootMargin: '240px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [items.length, pageSize, visibleCount])

  return {
    hasMore: visibleCount < items.length,
    sentinelRef,
    visibleItems: useMemo(() => items.slice(0, visibleCount), [items, visibleCount]),
  }
}
