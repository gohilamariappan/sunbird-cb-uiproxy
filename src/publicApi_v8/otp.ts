import axios from 'axios'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
  generateOtp: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/otp/v1/generate`,
  verifyOtp: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/otp/v1/verify`,
}
export const getOTP = async (userUUId: string, key: string, type: string) => {
  logInfo('generate otp endpoints for kong', API_END_POINTS.generateOtp)
  const otpResponse = await axios({
    ...axiosRequestConfig,
    data: {
      request: { userId: userUUId, key, type },
    },
    headers: { Authorization: CONSTANTS.SB_API_KEY },
    method: 'POST',
    url: API_END_POINTS.generateOtp,
  })
  logInfo('genreate otp response' + otpResponse)
  return otpResponse
}

export const validateOTP = async (
  userUUId: string,
  key: string,
  type: string,
  otp: string
) => {
  logInfo('Entered into /validateOtp ')
  const verifyOtpResponse = await axios({
    ...axiosRequestConfig,
    data: {
      request: {
        key,
        otp,
        type,
        userId: userUUId,
      },
    },
    headers: { Authorization: CONSTANTS.SB_API_KEY },
    method: 'POST',
    url: API_END_POINTS.verifyOtp,
  })
  logInfo('verify OTP response : ' + verifyOtpResponse)
  return verifyOtpResponse
}
