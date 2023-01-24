import axios from 'axios'
import express from 'express'
import jwt_decode from 'jwt-decode'
import _ from 'lodash'
import qs from 'querystring'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
import { generateRandomPassword } from '../utils/randomPasswordGenerator'
import { getCurrentUserRoles } from './rolePermission'

const AUTH_FAIL =
  'Authentication failed ! Please check credentials and try again.'
const API_END_POINTS = {
  createUser: `${CONSTANTS.KONG_API_BASE}/user/v3/create`,
  fetchUserByEmail: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/email/`,
  fetchUserByMobileNo: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/phone/`,
  generateToken: `${CONSTANTS.HTTPS_HOST}/auth/realms/sunbird/protocol/openid-connect/token`,
  sashaktUserDetailsUrl: `${CONSTANTS.SASHAKT_USER_DETAILS_URL}`,
  userRoles: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/user/private/v1/assign/role`,
}
export const sashakt = express.Router()
// tslint:disable-next-line: no-any
sashakt.get('/login', async (req: any, res) => {
  logInfo('Entered into sashakt route')
  const courseId = req.query.moduleId
  const host = req.get('host')
  let resRedirectUrl = `https://sphere.aastrika.org/app/toc/${courseId}/overview?primaryCategory=Course`
  try {
    const sashaktToken = 'Bearer ' + req.query.token
    const userDetailResponseFromShashakt = await axios({
      ...axiosRequestConfig,
      headers: {
        Authorization: sashaktToken,
      },
      method: 'POST',
      url: API_END_POINTS.sashaktUserDetailsUrl,
    })
    const sashaktData = userDetailResponseFromShashakt.data.userDetails[0]
    const sashaktEmail = sashaktData.email
    const sashaktPhone = sashaktData.phone
    const typeOfLogin = sashaktData.email ? 'email' : 'phone'
    logInfo('User details from shashakt', sashaktData)
    if (!sashaktData) {
      res.status(400).json({
        msg: 'User not present in sashakt',
        status: 'error',
        status_code: 400,
      })
      logInfo('User details not present in e shashakt')
    }
    const resultEmail = await fetchUserBymobileorEmail(sashaktEmail, 'email')
    logInfo(resultEmail, 'resultemail')
    const resultPhone = await fetchUserBymobileorEmail(sashaktPhone, 'phone')
    logInfo(resultPhone, 'resutPhone')

    logInfo('User details sunbird', resultEmail)
    if (!resultEmail && !resultPhone) {
      const randomPassword = generateRandomPassword(9, {
        digits: true,
        lowercase: true,
        uppercase: true,
        symbols: true,
      })

      logInfo(randomPassword)
      const responseCreateUser = await axios({
        ...axiosRequestConfig,
        data: {
          request: {
            channel: 'ShashaktOrg',
            firstName: sashaktData.firstname,
            lastName: sashaktData.lastname,
            password: randomPassword,
            [typeOfLogin]: sashaktData[typeOfLogin],
          },
        },
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
        },
        method: 'POST',
        url: API_END_POINTS.createUser,
      })
      logInfo('Response after user creation', responseCreateUser.data)
      const userRoleUpdate = await axios({
        ...axiosRequestConfig,
        data: {
          request: {
            organisationId: '0136856524313067523939',
            roles: ['PUBLIC'],
            userId: responseCreateUser.data.result.userId,
          },
        },
        headers: { Authorization: CONSTANTS.SB_API_KEY },
        method: 'POST',
        url: API_END_POINTS.userRoles,
      })
      logInfo('Data after role update', userRoleUpdate.data)
    }
    const encodedData = qs.stringify({
      client_id: 'eShashakt',
      client_secret: `${CONSTANTS.KEYCLOAK_CLIENT_SECRET_SASHAKT}`,
      grant_type: 'password',
      scope: 'offline_access',
      username: sashaktEmail || sashaktPhone,
    })
    logInfo('Entered into authorization part.' + encodedData)

    const authTokenResponse = await axios({
      ...axiosRequestConfig,
      data: encodedData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      url: API_END_POINTS.generateToken,
    })
    if (authTokenResponse.data) {
      const accessToken = authTokenResponse.data.access_token
      // tslint:disable-next-line: no-any
      const decodedToken: any = jwt_decode(accessToken)
      const decodedTokenArray = decodedToken.sub.split(':')
      const userId = decodedTokenArray[decodedTokenArray.length - 1]
      req.session.userId = userId
      logInfo(userId, 'userid......................')
      req.kauth = {
        grant: {
          access_token: { content: decodedToken, token: accessToken },
        },
      }
      req.session.grant = {
        access_token: { content: decodedToken, token: accessToken },
      }
      logInfo('Success ! Entered into usertokenResponse..')
      await getCurrentUserRoles(req, accessToken)
    } else {
      res.status(302).json({
        msg: AUTH_FAIL,
        status: 'error',
      })
    }
  } catch (err) {
    console.log(err)
    logError('Failed to process callback API.. error: ' + JSON.stringify(err))
    resRedirectUrl = `https://${host}/public/home`
  }
  logInfo(resRedirectUrl, 'redirectUrl')
  res.redirect(resRedirectUrl)
})

const fetchUserBymobileorEmail = async (
  searchValue: string,
  searchType: string
) => {
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
