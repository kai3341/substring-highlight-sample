import React, { useState, useCallback, memo, useRef, useContext } from 'react'
// import { useWMState /*, createMutableContext */ } from '@wrap-mutant/react'
import * as WMR from '@wrap-mutant/react'
import { UremontReviewModel, showAsyncToast } from 'src/actions'
import { ReviewsItem } from 'src/components/Uremont/ReviewsItem'
import { uremontHttpClient } from 'src/utils/experimental-http-client/v1'
import { useDispatch } from 'react-redux'
import useInfiniteScroll from 'react-infinite-scroll-hook'
import classes from './Sample.module.scss'
import { Loader } from 'src/components/Loader'
import { groupLog } from 'src/utils/groupLog'

import { sequence } from 'src/utils/sequence'

import { createMutableContext } from './createMutableContext'
import { RenderedArray } from './RenderedArray'

const { useWMState } = WMR
console.log(WMR)
// console.log(WMR.createMutableContext)

const _isDebugEnabled = true
const _customPagesLimit = null as number | null

const ReviewsItemCTX = createMutableContext({ updateItem: (diff: any) => {} })

const reviewID = sequence()

type TUremontPagination = {
  page: number
  pageSize: number
  pagesCount: number
  totalCount: number
}

const ItemRender = (props: UremontReviewModel) => {
  const ctx = useContext(ReviewsItemCTX)
  return <ReviewsItem item={props} key={props.id} updateItem={(diff) => ctx.updateItem(diff)} />
}

// const recordFactory = () => [] as UremontReviewModel[]
const recordFactory = () =>
  RenderedArray({
    Component: ItemRender,
    keyFunction: (item) => item.id,
  })

export const Sample = memo(() => {
  const dispatch = useDispatch()
  const [records, updateRecords] = useWMState(recordFactory, { wrap: false })

  const paginationRef = useRef<TUremontPagination>({
    page: 0, // NOTE: Will be mutated

    // NOTE: Reanonly. Controlled on backend anyway =)
    pageSize: 3,
    pagesCount: 1,
    totalCount: 1,
  })

  const [loading, setLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)

  const getListPack = useCallback(
    () =>
      uremontHttpClient.getRevewList<{
        ok: boolean
        reviews: UremontReviewModel[]
        pagination: TUremontPagination
      }>({
        isDebugEnabled: _isDebugEnabled,
        body: {
          page: paginationRef.current.page,
          page_size: 10,
          // pageSize: paginationRef.current.pageSize,
        },
        bodyType: 'formdata',
        cb: {
          onFuckup: (res) => {
            setLoading(false)
            groupLog({
              header: 'Request failed',
              argsArr: [res],
            })
            dispatch(
              showAsyncToast({
                type: 'error',
                text: res.message || 'Request failed, see console',
                delay: 10000,
              })
            )
          },
          onSuccess: (res) => {
            setLoading(false)
            const { reviews, pagination } = res
            for (const review of reviews) review.id = reviewID()
            records.push(...reviews)
            updateRecords()
            // @ts-ignore
            for (const key in pagination) if (key !== 'page') paginationRef.current[key] = pagination[key]

            dispatch(
              showAsyncToast({
                type: 'info',
                text: `+${reviews.length} (page ${paginationRef.current.page}; items ${records.length} of ${paginationRef.current.totalCount})`,
                delay: 3000,
              })
            )

            switch (true) {
              case !!_customPagesLimit:
                // @ts-ignore
                if (_customPagesLimit > paginationRef.current.page) paginationRef.current.page += 1
                // else setLoading(false)
                break
              case paginationRef.current.pagesCount > paginationRef.current.page:
                paginationRef.current.page += 1
                break
              default:
                setHasNextPage(false)
                break
            }
          },
        },
      }),
    [records, updateRecords, setLoading, paginationRef, dispatch]
  )

  const startLoading = useCallback(() => {
    if (loading) return
    setLoading(true)
    getListPack()
  }, [setLoading, getListPack])

  const infiniteRef: React.RefObject<HTMLDivElement> = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: startLoading,
    scrollContainer: 'window',
  })

  const updateItem = useCallback(
    (diff: any) => {
      const idx = records.findIndex((e) => e && e.id === diff.id)
      const item = records[idx]
      records[idx] = { ...item, ...diff }
      // delete records[idx]
      updateRecords()
    },
    [records, updateRecords]
  )

  const r = records.render()
  console.log(r)

  return (
    <div className={classes.stackWrapper} ref={infiniteRef}>
      <ReviewsItemCTX.Provider value={{ updateItem }}>{r}</ReviewsItemCTX.Provider>
      <div style={{ minHeight: '100px' }}>
        <Loader text={loading ? 'Loading...' : 'Done.'} />
      </div>
    </div>
  )
})
