import axios from 'axios'
import { Router } from 'express'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
const API_END_POINTS = {
  createUserWithMobileNo: `${CONSTANTS.KONG_API_BASE}/user/v3/create`,
  fetchUserByEmail: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/email/`,
  fetchUserByMobileNo: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/phone/`,
  generateOtp: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/otp/v1/generate`,
  searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
  verifyOtp: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/otp/v1/verify`,
}
export const emailOrMobileLogin = Router()
emailOrMobileLogin.post('/signup', async (req, res) => {
  try {
    if (!req.body.email) {
      res.status(400).json({
        msg: 'Email id. can not be empty',
        status: 'error',
        status_code: 400,
      })
    }
    const { firstName, email, lastName, password } = req.body
    // tslint:disable-next-line: no-any
    let profile: any = {}
    let isUserExist = {}
    let newUserDetails = {}
    logInfo('Req body', req.body)
    isUserExist = await fetchUserBymobileorEmail(email, 'email')
    if (!isUserExist) {
      logInfo('creating new  user')
      // tslint:disable-next-line: no-any
      profile = {
        emailId: email,
        fname: firstName,
        lname: lastName,
        psw: password,
        type: 'email',
      }
      newUserDetails = await createuserWithmobileOrEmail(profile).catch(
        handleCreateUserError
      )
      if (newUserDetails) {
        res.status(200).json({
          msg: 'user created successfully',
          status: 'success',
          status_code: 200,
        })
      }
    } else {
      logInfo('Email already exists.')
      res.status(400).json({
        msg: 'Email id  already exists.',
        status: 'error',
        status_code: 400,
      })
      return
    }
  } catch (error) {
    res.status(401).send({
      error: 'error while creating user !!',
    })
  }
})

// generate otp to register the user
emailOrMobileLogin.post('/generateOtp', async (req, res) => {
  try {
    if (!req.body.mobileNumber) {
      res.status(400).json({
        msg: 'Mobile no.or email. can not be empty',
        status: 'error',
        status_code: 400,
      })
    }
    logInfo('Entered into /generateOtp ')
    const mobileNumber = req.body.mobileNumber
    const userSearch = await axios({
      ...axiosRequestConfig,
      data: {
        request: { query: '', filters: { phone: mobileNumber.toLowerCase() } },
      },
      method: 'POST',
      url: API_END_POINTS.searchSb,
    })
    if (userSearch.data.result.response.count > 0) {
      const userUUId = _.get(
        _.find(userSearch.data.result.response.content, 'userId'),
        'userId'
      )
      logInfo('User Id : ', userUUId)
      logInfo('generate otp endpoints for kong', API_END_POINTS.generateOtp)
      const sendResponse = await axios({
        ...axiosRequestConfig,
        data: {
          request: { userId: userUUId, key: mobileNumber, type: 'phone' },
        },
        headers: { Authorization: CONSTANTS.SB_API_KEY },
        method: 'POST',
        url: API_END_POINTS.generateOtp,
      })
      logInfo('Sending Responses in phone part : ' + sendResponse)
      res.status(200).send({ message: 'Success ! Please verify the OTP .' })
    }
  } catch (error) {
    res.status(500).send({
      error: 'Failed due to unknown reason',
    })
  }
})

emailOrMobileLogin.post('/registerUserWithMobile', async (req, res) => {
  try {
    const validOtp = req.body.data.otp
    const mobileNumber = req.body.mobileNumber
    // tslint:disable-next-line: no-any
    let profile: any = {}
    let newUserDetails = {}
    const userSearch = await axios({
      ...axiosRequestConfig,
      data: {
        request: { query: '', filters: { phone: mobileNumber.toLowerCase() } },
      },
      method: 'POST',
      url: API_END_POINTS.searchSb,
    })
    if (userSearch.data.result.response.count > 0) {
      const userUUId = _.get(
        _.find(userSearch.data.result.response.content, 'userId'),
        'userId'
      )
      logInfo('User Id : ', userUUId)
      const verifyOtpResponse = await axios({
        ...axiosRequestConfig,
        data: {
          request: {
            key: mobileNumber,
            otp: validOtp,
            type: 'mobile',
            userId: userUUId,
          },
        },
        headers: { Authorization: CONSTANTS.SB_API_KEY },
        method: 'POST',
        url: API_END_POINTS.verifyOtp,
      })
      if (verifyOtpResponse.data.result === 'SUCCESS') {
        logInfo('opt verify : ')
        const { phone, firstName, lastName, password } = req.body
        profile = {
          fname: firstName,
          lname: lastName,
          mobile: phone,
          psw: password,
          type: 'phone',
        }
        newUserDetails = await createuserWithmobileOrEmail(profile).catch(
          handleCreateUserError
        )
        logInfo('Sending Responses in phone part : ' + newUserDetails)
        if (newUserDetails) {
          res.status(200).json({
            msg: 'user created successfully',
            status: 'success',
            status_code: 200,
          })
        }
      }
    }
  } catch (error) {
    res.status(500).send({
      error: 'Failed due to unknown reason',
    })
  }
})

// tslint:disable-next-line: no-any
const handleCreateUserError = (error: any) => {
  logInfo('Error ocurred while creating user' + error)
  if (_.get(error, 'error.params')) {
    throw error.error.params
  } else if (error instanceof Error) {
    throw error.message
  } else {
    throw new Error('unhandled exception while getting userDetails')
  }
}
// tslint:disable-next-line: no-any

const fetchUserBymobileorEmail = async (
  searchValue: string,
  searchType: string
) => {
  logInfo(
    'Checking Fetch Mobile no : ',
    API_END_POINTS.fetchUserByMobileNo + searchValue
  )
  try {
    const response = await axios({
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
      },
      method: 'GET',
      url:
        searchType === 'email'
          ? API_END_POINTS.fetchUserByEmail + searchValue
          : API_END_POINTS.fetchUserByMobileNo + searchValue,
    })
    logInfo('Response Data in JSON :', JSON.stringify(response.data))
    logInfo('Response Data in Success :', response.data.responseCode)
    if (response.data.responseCode === 'OK') {
      logInfo(
        'Response result.exists :',
        _.get(response, 'data.result.exists')
      )
      return _.get(response, 'data.result.exists')
    }
  } catch (err) {
    logError('fetchUserByMobile  failed')
  }
}
// tslint:disable-next-line: no-any
const createuserWithmobileOrEmail = async (accountDetails: any) => {
  if (!accountDetails.fname || accountDetails.fname === '') {
    throw new Error('USER_NAME_NOT_PRESENT')
  }

  try {
    const response = await axios({
      ...axiosRequestConfig,
      data: {
        request: {
          firstName: accountDetails.fname,
          lastName: accountDetails.lname,
          password: accountDetails.psw,
          [accountDetails.type]: accountDetails.mobile
            ? accountDetails.mobile
            : accountDetails.emailId,
        },
      },
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
      },
      method: 'POST',
      url: API_END_POINTS.createUserWithMobileNo,
    })
    if (response.data.responseCode === 'OK') {
      logInfo('Log of createuser if OK :')
      return response.data
    } else {
      throw new Error(
        _.get(response.data, 'params.errmsg') ||
          _.get(response.data, 'params.err')
      )
    }
  } catch (err) {
    logError('createuserwithmobile failed')
  }
}
