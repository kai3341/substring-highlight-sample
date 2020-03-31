import {
  put,
  takeEvery, // Позволяет производить отслеживание (тип события, выполняемый воркер)
  call,
} from 'redux-saga/effects'
import {
  SHOW_TOAST_ASYNC,
  SHOW_TOAST_START,
  SHOW_TOAST_FINISH,
  HIDE_TOAST_START,
  HIDE_TOAST_FINISH,
  REMOVE_TOAST,
  FORCE_HIDE_TOAST,
} from '../../actions'

export const delay = ms => new Promise(res => setTimeout(res, ms))
export function* asyncToasterWorker({ payload }) {
  const id = Math.random()

  yield put({ type: SHOW_TOAST_START, payload: { text: payload.text, id, type: payload.type } })
  yield call(delay, 100)
  yield put({ type: SHOW_TOAST_FINISH, payload: id })
  yield call(delay, payload.delay)
  yield put({ type: HIDE_TOAST_START, payload: id })
  yield call(delay, 500)
  yield put({ type: HIDE_TOAST_FINISH, payload: id })
  yield call(delay, 500)
  yield put({ type: REMOVE_TOAST, payload: id })
}
export function* forcehideToasterWorker({ payload }) {
  yield put({ type: HIDE_TOAST_START, payload })
  yield call(delay, 100)
  yield put({ type: HIDE_TOAST_FINISH, payload })
  yield call(delay, 500)
  yield put({ type: REMOVE_TOAST, payload })
}
export function* watchToaster() {
  yield takeEvery(SHOW_TOAST_ASYNC, asyncToasterWorker)
  yield takeEvery(FORCE_HIDE_TOAST, forcehideToasterWorker)
}
