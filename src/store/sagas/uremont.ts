import { put, takeLatest, call, select } from 'redux-saga/effects'
import {
  ASYNC_LOAD_REVIEW_ITEMS,
  setIsLoadingReviewItems,
  LoadReviewItemsParamsModel,
  addReviewsItems,
  // LoadReviewItemsResponseModel,
  showAsyncToast,
} from 'src/actions'
import { RootStateModel } from '../RootStateModel'
import { HttpRequestError } from 'src/utils/errors/HttpRequestError'
import { sequence } from 'src/utils/sequence'

const reviewID = sequence()

export function fetchReviewsData(params: LoadReviewItemsParamsModel) {
  const body = new FormData()
  const expectedFields = ['page', 'page_size', 'review_rating_from', 'review_rating_to'] as Array<
    keyof LoadReviewItemsParamsModel
  >

  expectedFields.forEach((e) => {
    const value = params[e]
    if (value) {
      switch (e) {
        // arrays
        // case 'as-array':
        // params[e].map(e => body.append(`${e}[]`, params[e]))
        // break
        // strings & others
        default:
          body.append(e, value.toString())
          break
      }
    }
  })

  return fetch('https://api-frontend.uservice.io/common/default/review-list/', {
    method: 'POST',
    body,
  })
    .then((res) => {
      if (res.ok) {
        return res.json()
      } else {
        throw new HttpRequestError(res.status, 'Неожиданный ответ от сервера')
      }
    })
    .then((json) => {
      if (json.success === 1) {
        for (const review of json.reviews) review.id = reviewID()
        return json
      } else {
        throw new Error(json)
      }
    })
    .catch((err: any) => {
      // 1. Http errors:
      if (err instanceof HttpRequestError) {
        return {
          success: 0,
          errors: {
            reason: [err.status, err.message],
          },
        }
      }
      // 2. Other errors from backend:
      if (err && err.errors) {
        return {
          success: 0,
          errors: err.errors,
        }
      }
      // 3. Undefined error:
      return {
        success: 0,
        errors: {
          errType1: ['Неизвестная ошибка'],
        },
      }
    })
}

const getReviewsLength = (state: RootStateModel) => state.uremont.reviews.items.length
export function* asyncLoadReviewItemsWorker(action: any) {
  const { payload } = action

  yield put(setIsLoadingReviewItems(true))

  // @ts-ignore
  const data = yield call(fetchReviewsData, payload)

  if (data.success === 1 && data.reviews && Array.isArray(data.reviews)) {
    yield put(
      addReviewsItems({
        reviews: data.reviews,
        pagination: data.pagination,
      })
    )
    // @ts-ignore
    const reviewsLength = yield select(getReviewsLength)
    yield put(
      showAsyncToast({
        text: `${reviewsLength} of ${data.pagination.totalCount} received`,
        delay: 5000,
        type: 'info',
      })
    )
  } else {
    let text = 'Ошибка'
    let errorsStr = ''

    if (data.errors && Object.keys(data.errors).length > 0) {
      Object.keys(data.errors).forEach((e: any) => {
        if (Array.isArray(data.errors[e])) {
          data.errors[e].forEach((str: string) => {
            errorsStr += `; ${str}`
          })
        }
      })
    }

    yield put(
      showAsyncToast({
        text: text.concat(': ', errorsStr.slice(2)),
        delay: 60000,
        type: 'error',
      })
    )
  }

  yield put(setIsLoadingReviewItems(false))
}

export function* watchAsyncLoadReviewItems() {
  yield takeLatest(ASYNC_LOAD_REVIEW_ITEMS, asyncLoadReviewItemsWorker)
}
