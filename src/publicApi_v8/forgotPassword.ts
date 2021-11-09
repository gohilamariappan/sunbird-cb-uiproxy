import axios from 'axios'
import { Router } from 'express'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
                        searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
                        resendOTP: `${CONSTANTS.MSG91BASE}/api/v5/otp/retry`,
                        sendOTP: `${CONSTANTS.MSG91BASE}/api/v5/otp`,
                        verifyOTP: `${CONSTANTS.MSG91BASE}/api/v5/otp/verify`,
                        }

const msgKey = CONSTANTS.MSG91KEY
// Routes
// create account
const MSGERROR = 'MSG91 ERROR'                        

export const forgotPassword = Router()

forgotPassword.post('/reset/proxy/password', async (req, res) => {
    logInfo('Entered into reset password ')
    try {
        logInfo('Entered into try block ')
        const sbUsername = req.body.userName

        logInfo('Entered into try block userName : ', sbUsername)

        const searchresponse = await axios({
            ...axiosRequestConfig,
            data: { request: { query: '', filters: { email: sbUsername.toLowerCase() } } },
            method: 'POST',
            url: API_END_POINTS.searchSb,
        })
        if (searchresponse.data.result.response.count > 0) {
            logInfo('User found with user id : ', searchresponse.data.result.response.content.userId)
           const userId =  _.get(_.find(searchresponse.data.result.response.content,'userId'), 'userId')
          // const mobileNumber = req.body.mobileNumber
           // generate otp
           const userType = await emailOrMobile(sbUsername)
           //await sendOTP(mobileNumber)
           logInfo("User type : ", userType)
           logInfo("User Id : ", userId)
           logInfo("UserName : ", sbUsername)
           res.status(200).send(userId)
           //res.status(200).json({message: 'Success'})
           return
            //res.status(200).send(userId)

        } else {
            logInfo('Couldnot find the user : ', searchresponse.data.result.response)
            res.status(302).send(searchresponse.data.result.response.count)
        }
        return

    } catch (err) {
        logError('ERROR CREATING USER REGISTRY > ' + err)
        res.status(500).send('Error ' + err)
    }
})

export function emailOrMobile(value: string) {
    const isValidEmail = emailValidator(value)
    if (isValidEmail) {
      return 'email'
    } else {
      const isValidMobile = mobileValidator(value)
      if (isValidMobile) {
        return 'phone'
      }
    }
    return 'error'
  }

  export function emailValidator(value: string) {
    // tslint:disable-next-line: max-line-length
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)
  }
  const mobileValidator = (value: string) => {
    return /^([7-9][0-9]{9})$/.test(value)
  }

  export async function sendOTP(mobileNumber: string) {
    try {
      mobileNumber = '91' + mobileNumber
      const url = `${API_END_POINTS.sendOTP}?authkey=${msgKey}&template_id=${CONSTANTS.MSG91TEMPLATEID}&mobile=${mobileNumber}&invisible=1`
      return await axios.get(url, axiosRequestConfig)
    } catch (err) {
      logError(MSGERROR, err)
      return 'Error'
    }
  
  }