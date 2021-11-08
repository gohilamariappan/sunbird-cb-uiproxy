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
    logInfo('Google auth callback called' )
    try {
     
        logInfo('Entering into forgot password section : ', sbemail )
        const isUserExist = await fetchUserByEmailId(sbemail)
        if (isUserExist) {
            logInfo('Email already exists.')
            _res.status(400).json({ status: 'error' , status_code: 400, msg: 'Email already exists.' })
        } else {
            logInfo('Check !! User doesnot exists !! ')
            
                _res.status(200).json({ status: 'success', status_code: 200, msg: 'User doesnot exist!!'})
           
        }
        return
    } catch (err) {
        _res.status(401).send('Token Expired !!')
        logError('ERROR CREATING USER' + err )
    }

})


const fetchUserByEmailId = async (emailId: string) => {
    logInfo('Checking Fetch email id value : ', API_END_POINTS.fetchUserByEmailId + emailId)
    try {
        const response = await axios( {
            ...axiosRequestConfig,
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'GET',
            url: API_END_POINTS.fetchUserByEmailId + emailId,

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

  }
