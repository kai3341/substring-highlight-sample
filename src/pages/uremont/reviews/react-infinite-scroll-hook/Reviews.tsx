import React, { useEffect, useState, useCallback } from 'react'
import mainStyles from 'src/styles/App.module.scss'
import { loadReviewItems, UremontReviewModel, resetReviewItems, setReviewItems } from 'src/actions'
import { useSelector, useDispatch } from 'react-redux'
import { RootStateModel } from 'src/store/RootStateModel'
import useInfiniteScroll from 'react-infinite-scroll-hook'
import { Loader } from 'src/components/Loader'
import { ReviewsItem } from 'src/components/Uremont/ReviewsItem'
import styles from './Reviews.module.scss'

export const Reviews: React.FC = () => {
  const dispatch = useDispatch()
  const reviews: UremontReviewModel[] = useSelector((state: RootStateModel) => state.uremont.reviews.items)
  const pagesCount: number = useSelector((state: RootStateModel) => state.uremont.reviews.pagination.pagesCount)
  const isLoading: boolean = useSelector((state: RootStateModel) => state.uremont.reviews.isLoading)
  const [page, setPage] = useState(1)
  const handleScrollToContent = useCallback(() => {
    window?.scrollTo({
      behavior: 'smooth',
      top: window.innerHeight - 100,
      left: 0,
    })
  }, [])

  function handleLoadMore(): void {
    if (pagesCount > page) setPage(page + 1)
  }

  const infiniteRef: React.RefObject<HTMLDivElement> = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: pagesCount > page,
    onLoadMore: handleLoadMore,
    scrollContainer: 'window',
  })

  useEffect(() => {
    dispatch(
      loadReviewItems({
        page,
        page_size: 10,
        review_rating_from: 1,
        review_rating_to: 10,
      })
    )
  }, [page, dispatch])

  useEffect(() => {
    handleScrollToContent()
    dispatch(resetReviewItems())
    return () => {
      dispatch(resetReviewItems())
    }
  }, [dispatch, handleScrollToContent])

  const updateItem = useCallback(
    (diff: any) => {
      const idx = reviews.findIndex((e) => e.id === diff.id)
      const item = reviews[idx]
      const newItem = { ...item, ...diff }
      const newItems = [...reviews]
      newItems[idx] = newItem
      dispatch(setReviewItems(newItems))
    },
    [dispatch, reviews]
  )

  return (
    <div className={mainStyles.container} ref={infiniteRef}>
      <header className={mainStyles.header} />
      <div className={styles.wrapper}>
        {reviews.map((e) => (
          <ReviewsItem key={e.id} item={e} updateItem={updateItem} />
        ))}
      </div>
      <div style={{ minHeight: '100px' }}>{<Loader text={page === 1 || isLoading ? 'Loading...' : 'Done.'} />}</div>
    </div>
  )
}
