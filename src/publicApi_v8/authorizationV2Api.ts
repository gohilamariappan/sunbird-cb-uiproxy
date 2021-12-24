import axios from 'axios'
import _ from 'lodash'
import qs from 'querystring'
import { axiosRequestConfig } from '../configs/request.config'
import { setSessionConfig } from '../configs/session.config'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'

const API_END_POINTS = {
  generateToken : `https://aastrika-sb.idc.tarento.com/auth/realms/sunbird/protocol/openid-connect/token`,
  verfifyToken  : `https://aastrika-sb.idc.tarento.com/auth/realms/sunbird/protocol/openid-connect/userinfo`,
}
export const authorizationV2Api = async (username: string, password: string) => {
  logInfo('Entered into authorization part.')

  const encodedData = qs.stringify({
        client_id: 'portal',
        client_secret: `${CONSTANTS.KEYCLOAK_CLIENT_SECRET}`,
        grant_type: 'password',
        password,
        username,
        })
  logInfo('Entered into authorization part.', encodedData)
  const authTokenResponse = await axios({
        ...axiosRequestConfig,
        data: encodedData,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',

        url: API_END_POINTS.generateToken,
    })

  const accessToken = authTokenResponse.data.access_token

  logInfo('authTokenResponse :' + JSON.stringify(authTokenResponse))
  logInfo('accessToken ' + JSON.stringify(accessToken))

  if (authTokenResponse) {
        const userTokenResponse = await axios({
            ...axiosRequestConfig,
            headers: {
                Authorization : `Bearer ${accessToken}`,
            },
            method: 'GET',

            url: API_END_POINTS.verfifyToken,
        })
        logInfo('userTokenResponse : ', JSON.stringify(userTokenResponse))
        if (userTokenResponse.data.name) {
            logInfo('Success ! Entered into setting cookie')
            setSessionConfig()
            return true
        }
        return userTokenResponse
    }
  return authorizationV2Api
}
