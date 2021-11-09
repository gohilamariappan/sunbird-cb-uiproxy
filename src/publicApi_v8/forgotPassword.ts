import axios from 'axios'
import { Router } from 'express'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
import {  getUser, resetKCPassword, verifyOTP } from './customSignup'

const API_END_POINTS = {
                        generateOtp: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/otp/v1/generate`,
                        resendOTP: `${CONSTANTS.MSG91BASE}/api/v5/otp/retry`,
                        searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
                        verifyOtp: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/otp/v1/verify`,
                        }

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

            const userUUId =  _.get(_.find(searchresponse.data.result.response.content, 'userId'), 'userId')
            const userType = await emailOrMobile(sbUsername)

            logInfo('User type : ', userType)
            logInfo('User Id : ', userUUId)
            logInfo('UserName : ', sbUsername)

           // generate otp
            const sendResponse = await axios({
                ...axiosRequestConfig,
                data: { request: { userId : userUUId, key  : sbUsername , type: userType } },
                headers: {
                    Authorization: req.header('Authorization'),
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                url: API_END_POINTS.generateOtp,
            })
            logInfo('Sending Response : ' + sendResponse)
            res.status(200).send(userUUId)
           // res.status(200).send({message: 'Success ! Please verify the OTP .'})
            return
        } else {
            logInfo('Couldnot find the user : ', searchresponse.data.result.response)
            res.status(302).send(searchresponse.data.result.response.count)
        }
        return

    } catch (err) {
        logError('ERROR in Searching User ' + err)
        res.status(500).send('Error ' + err)
    }
})

forgotPassword.post('/setPasswordWithOTP', async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const otp = req.body.otp
    const userData = await getUser(username)
    if (userData) {
      const verification = await verifyOTP(username, otp)
      if (verification.type === 'success') {
        try {
          const userId = userData[0].id

          const status = resetKCPassword(userId, password)
          res.status(200).json({ message: status })
        } catch (e) {
          res.status(500).send({
            error: e.response,
          })
        }
      } else {
        res.status(401).send({
          error: 'Invalid Otp',
        })
      }
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
