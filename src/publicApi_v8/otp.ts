import axios from 'axios'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'

const API_END_POINTS = {
  generateOtp: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/otp/v1/generate`,
  verifyOtp: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/otp/v1/verify`,
}
export const getOTP = async (
                                userUUId: string,
                                userKey: string,
                                userType: string
                              ) => {
  logInfo('generate otp endpoints for kong', API_END_POINTS.generateOtp)
  return axios({
    ...axiosRequestConfig,
    data: {
      request: { userId: userUUId, key: userKey, type: userType },
    },
    headers: { Authorization: CONSTANTS.SB_API_KEY },
    method: 'POST',
    url: API_END_POINTS.generateOtp,
  })
}

export const validateOTP = async (
  userUUId: string,
  userKey: string,
  userType: string,
  userOtp: string
) => {
  logInfo('Entered into /validateOtp ')
  return axios({
    ...axiosRequestConfig,
    data: {
      request: {
        key: userKey,
        otp: userOtp,
        type: userType,
        userId: userUUId,
      },
    },
    headers: { Authorization: CONSTANTS.SB_API_KEY },
    method: 'POST',
    url: API_END_POINTS.verifyOtp,
  })
}
