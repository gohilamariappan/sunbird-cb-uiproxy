import axios from 'axios'
import { Router } from 'express'
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
        const res = await axios( {
            ...axiosRequestConfig,
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'GET',
            url: API_END_POINTS.fetchUserByEmailId + sbemail,

        })
        logInfo( 'res Data in JSON :', JSON.stringify(res.data))
        logInfo( 'res Data in Success :', res.data.responseCode)
        if (res.data.responseCode === 'OK') {
            logInfo( 'res result.exists :', _.get(res, 'data.result.exists'))
            return _.get(res, 'data.result.exists')
        }
    } catch (err) {
        logError( 'fetchUserByEmailId failed : ' + err)
    }
})
