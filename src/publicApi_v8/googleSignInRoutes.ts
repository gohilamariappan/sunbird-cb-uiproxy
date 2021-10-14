import axios from 'axios'
import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
const API_END_POINTS = {
    createUserWithMailId: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/user/v2/signup`,
   fetchUserByEmailId: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/user/v1/exists/email`,

}
const client = new OAuth2Client(CONSTANTS.GOOGLE_CLIENT_ID)
export const googleAuth = Router()

googleAuth.get('/callback', async (req) => {
    logInfo('google auth callback called' )
    try {
        const { idToken } = req.body
        await client.verifyIdToken({
            audience: CONSTANTS.GOOGLE_CLIENT_ID,
            idToken,
          }).then((response) => {
            if (response.getPayload()) {
                // tslint:disable-next-line: no-any
                const data: any = response.getPayload()
                // tslint:disable-next-line: no-any
                const googleProfile: any = {
                    emailId : data.email,
                    name : data.name,
                }
                const isUserExist = fetchUserByEmailId(googleProfile.emailId)
                logInfo('sunbird profile fetched' + JSON.stringify(isUserExist))
                if (!isUserExist) {
                    createUserwithMailId(googleProfile, CONSTANTS.GOOGLE_CLIENT_ID)
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
// tslint:disable-next-line: no-any
const createUserwithMailId = async (accountDetails: any, client_id: string) => {
    if (!accountDetails.name || accountDetails.name === '') {
      throw new Error('USER_NAME_NOT_PRESENT')
    }
    try {
        const response = await axios( {
            ...axiosRequestConfig,
            data: {
                body: {
                params: {
                  signupType: 'google',
                  source: client_id,
                },
                request: {
                  email: accountDetails.emailId,
                  emailVerified: true,
                  firstName: accountDetails.name,

                }},
            },
            headers: {
                    Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'POST',
            url: API_END_POINTS.createUserWithMailId,

        })
        if (response.data.responseCode === 'OK') {
            return response.data
        }
    } catch (err) {
        logError( 'createUserWithMailId failed')
    }

  }
const fetchUserByEmailId = async (emailId: string) => {
    try {
        const response = await axios( {
            ...axiosRequestConfig,
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'GET',
            url: API_END_POINTS.fetchUserByEmailId + emailId,

        })
        if (response.data.responseCode === 'OK') {
            return _.get(response, 'result.exists')
        }
    } catch (err) {
        logError( 'fetchUserByEmailId failed')
    }

  }
