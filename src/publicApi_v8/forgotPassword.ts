import axios from 'axios'
import { Router } from 'express'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
    fetchUserByEmailId: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/email/`,
    kongSearchUser: `${CONSTANTS.KONG_API_BASE}/user/v1/search`,
    kongUserResetPassword: `${CONSTANTS.KONG_API_BASE}/private/user/v1/password/reset`,
  }

export const forgotPassword = Router()

forgotPassword.post('/verify', async (req, _res) => {
    const sbemail = req.body.personalDetails.email
    logInfo('Entered into forgot password and email is : ', sbemail)
    logInfo('Checking Fetch email id value : ', API_END_POINTS.fetchUserByEmailId + sbemail)
    try {
        const response = await axios( {
            ...axiosRequestConfig,
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'GET',
            url: API_END_POINTS.fetchUserByEmailId + sbemail,

        })
        logInfo( 'Response Data in JSON :', JSON.stringify(response.data))
        logInfo( 'Response Data in Success :', response.data.responseCode)
        if (response.data.responseCode === 'OK') {
            logInfo( 'Response result.exists :', _.get(response, 'data.result.exists'))
            return _.get(response, 'data.result.exists')
        }
    } catch (err) {
        logError( 'fetchUserByEmailId failed')
    }
})
