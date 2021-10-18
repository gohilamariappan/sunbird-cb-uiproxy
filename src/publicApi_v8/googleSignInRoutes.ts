import axios from 'axios'
import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
const API_END_POINTS = {
    createUserWithMailId: `${CONSTANTS.KONG_API_BASE}/user/v2/signup`,
   fetchUserByEmailId: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/email/`,

}
const client = new OAuth2Client(CONSTANTS.GOOGLE_CLIENT_ID)
export const googleAuth = Router()

googleAuth.post('/callback', async (req, res) => {
    logInfo('google auth callback called' )
    try {
        const { idToken } = req.body
        await client.verifyIdToken({
            audience: CONSTANTS.GOOGLE_CLIENT_ID,
            idToken,
          }).then((response) => {
            logInfo('Response of Auth token : ' + response)
            if (response.getPayload()) {
                // tslint:disable-next-line: no-any
                const data: any = response.getPayload()
                // tslint:disable-next-line: no-any
                const googleProfile: any = {
                    emailId : data.email,
                    name : data.name,
                }

                logInfo('Get payload', data)
                const isUserExist = fetchUserByEmailId(googleProfile.emailId)
                isUserExist.then((responses) => {
                    logInfo('User Exist Response : ', responses)
                    if (!responses) {
                        logInfo('User Doesnt Exist Response : ', responses)
                        createuserwithmailId(googleProfile, CONSTANTS.GOOGLE_CLIENT_ID)
                    }
                })
                res.end()
            } else {
                res.status(400).send('Fetched user profile failed')
                logInfo('Fetched user profile failed')
            }
          })
    } catch (err) {

        logError('ERROR CREATING USER' + err )
    }

})
// tslint:disable-next-line: no-any
const createuserwithmailId = async (accountDetails: any, client_id: string) => {
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
    logInfo("Checking Fetch email id value : ", API_END_POINTS.fetchUserByEmailId + emailId)
    try {
        const response = await axios( {
            ...axiosRequestConfig,
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'GET',
            url: API_END_POINTS.fetchUserByEmailId + emailId,

        })
        logInfo( 'Response Data in Success :', response.data)
        if (response.data.responseCode === 'OK') {
            return _.get(response, 'result.exists')
        }
    } catch (err) {
        logError( 'fetchUserByEmailId failed')
    }

  }
