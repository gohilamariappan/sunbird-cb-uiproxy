import axios from 'axios'
import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
const API_END_POINTS = {
    createUserWithMailId: `${CONSTANTS.KONG_API_BASE}/user/v1/signup`,
   fetchUserByEmailId: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/email/`,

}
const client = new OAuth2Client(CONSTANTS.GOOGLE_CLIENT_ID)
export const googleAuth = Router()

googleAuth.post('/callback', async (req, res) => {
    logInfo('google auth callback called' )
    try {
        const { idToken } = req.body
        // tslint:disable-next-line: no-any
        let googleProfile: any = {}
        let isUserExist = {}
        let newUserDetails = {}
        const isTokenVerfiy = await client.verifyIdToken({
            audience: CONSTANTS.GOOGLE_CLIENT_ID,
            idToken,
        })
        if (isTokenVerfiy && isTokenVerfiy.getPayload()) {
                // tslint:disable-next-line: no-any
                const data: any = isTokenVerfiy.getPayload()
                logInfo('google user data', data )
                // tslint:disable-next-line: no-any
                googleProfile = {
                    emailId : data.email,
                    name : data.name,
                }
        }
        logInfo('google profile ', googleProfile )
        isUserExist = await fetchUserByEmailId(googleProfile.emailId)
        if (!isUserExist) {
            logInfo('creating new google user')
            newUserDetails =  await createuserwithmailId(googleProfile)
            if (newUserDetails) {
                res.status(200).send('user created successfully')
            }
        }
    } catch (err) {
        res.status(400).send('Token Expired !!')
        logError('ERROR CREATING USER' + err )
    }

})

// tslint:disable-next-line: no-any
const createuserwithmailId = async (accountDetails: any) => {
    if (!accountDetails.name || accountDetails.name === '') {
      throw new Error('USER_NAME_NOT_PRESENT')
    }
    try {
        const response = await axios( {
            ...axiosRequestConfig,
            data: {
                request: {
                  email: accountDetails.emailId,
                  emailVerified: true,
                  firstName: accountDetails.name,
                  lastname :  accountDetails.name,
                },
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
