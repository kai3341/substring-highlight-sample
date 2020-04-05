export const ADD_REVIEW_ITEMS = 'ADD_REVIEW_ITEMS'
export const SET_REVIEW_ITEMS = 'SET_REVIEW_ITEMS'
export const ASYNC_LOAD_REVIEW_ITEMS = 'ASYNC_LOAD_REVIEW_ITEMS'
export const SET_IS_LOADING_REVIEW_ITEMS = 'SET_IS_LOADING_REVIEW_ITEMS'

export interface UremontReviewModel {
  customer_image?: string
  customer_name: string
  customer_auto: string
  rating: number
  location_rate: number
  qualification_rate: number
  appearance_rate: number
  repair_quality_rate: number
  final_cost_rate: number
  service: any
  cost: number
  text: string
  create_time: number
}

export interface LoadReviewItemsParamsModel {
  page: number
  review_rating_from: number
  review_rating_to: number
}
export interface ReviewsPayloadModel {
  reviews: UremontReviewModel[]
  totalCount: number
  pagesCount: number
  pageSize: number
}

export const resetReviewItems = () => {
  return {
    type: SET_REVIEW_ITEMS,
    payload: [],
  }
}

export const addReviewsItems = (payload: ReviewsPayloadModel) => {
  return {
    type: ADD_REVIEW_ITEMS,
    payload,
  }
}

export const loadReviewItems = (params: LoadReviewItemsParamsModel) => {
  return { type: ASYNC_LOAD_REVIEW_ITEMS, payload: params }
}

export const setIsLoadingReviewItems = (value: boolean) => {
  return { type: SET_IS_LOADING_REVIEW_ITEMS, payload: value }
}
