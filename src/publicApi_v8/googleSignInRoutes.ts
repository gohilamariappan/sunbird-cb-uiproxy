import axios from 'axios'
import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
const API_END_POINTS = {
   fetchUserByEmailId: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/user/v1/exists/email`,
   createUserWithMailId: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/user/v2/signup`,
}
const client = new OAuth2Client(CONSTANTS.GOOGLE_CLIENT_ID)
export const googleAuth = Router()

googleAuth.get('/google/auth/callback', async (req) => {
    logInfo('google auth callback called' )
    let googleProfile, isUserExist, newUserDetails = {}
    try {
        const { idToken } = req.body
        await client.verifyIdToken({
            idToken,
            audience: CONSTANTS.GOOGLE_CLIENT_ID,
          }).then((response) => {
            if (response.getPayload() && response.getPayload() ?.email_verified ) {
                googleProfile = {
                    emailId : response.getPayload()?.email,
                    name : response.getPayload() ?.name,
                }
                isUserExist = fetchUserByEmailId(googleProfile.emailId)
                logInfo('sunbird profile fetched' + JSON.stringify(isUserExist))
                if (!isUserExist) {
                    newUserDetails = createUserWithMailId(googleProfile, CONSTANTS.GOOGLE_CLIENT_ID)
                    logInfo('google sign in success' + googleProfile)
                }
            } else {
                logInfo('fetched user profile')
            }
          })
    } catch (err) {
        logError('ERROR CREATING USER>', )
    }

})

const fetchUserByEmailId = async (emailId: any) => {
    const response = await axios( {
        ...axiosRequestConfig,
         method: 'GET',
         url: API_END_POINTS.fetchUserByEmailId + emailId,
         headers: {
           Authorization: CONSTANTS.SB_API_KEY,
       },
    })
    if (response.data.responseCode === 'OK') {
        return _.get(response, 'result.exists')
    } else {
        logError( 'fetchUserByEmailId failed')
    }
  }

const createUserWithMailId = async (accountDetails: any, client_id: any) => {
    if (!accountDetails.name || accountDetails.name === '') {
      throw new Error('USER_NAME_NOT_PRESENT')
    }
    const response = await axios( {
        ...axiosRequestConfig,
        method: 'POST',
        url: API_END_POINTS.createUserWithMailId,
        data: {
            body: {
            params: {
              source: client_id,
              signupType: 'google',
            },
            request: {
              firstName: accountDetails.name,
              email: accountDetails.emailId,
              emailVerified: true,
            }},
            },
          headers: {
            Authorization: CONSTANTS.SB_API_KEY,
         },
    })
    if (response.data.responseCode === 'OK') {
        return response.data
    } else {
        logError( 'createUserWithMailId failed')
    }
  }
