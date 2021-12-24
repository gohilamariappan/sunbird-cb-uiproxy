import axios from 'axios'
import qs from 'querystring'
import _ from 'lodash'
import { CONSTANTS } from '../utils/env'
import { axiosRequestConfig } from '../configs/request.config'
import { logInfo } from '../utils/logger'

const API_END_POINTS = {
  generateToken : `https://aastrika-sb.idc.tarento.com/auth/realms/sunbird/protocol/openid-connect/token`,
  verfifyToken  : `https://aastrika-sb.idc.tarento.com/auth/realms/sunbird/protocol/openid-connect/userinfo`
}
export const authorizationV2Api = async (username:string, password:string) => {
  logInfo('Entered into authorization part.')
  let EncodedData = qs.stringify({
    'client_id': 'portal',
    'client_secret': `${CONSTANTS.KEYCLOAK_CLIENT_SECRET}`,
    'grant_type': 'password',
    'username'  :  username,
    'password'  :  password,
    });

  const authTokenResponse = await axios({
    ...axiosRequestConfig,
    data: EncodedData,
    headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    
    url: API_END_POINTS.generateToken,
  })

  const accessToken = authTokenResponse.data.access_token

  logInfo('authTokenResponse :' + JSON.stringify(authTokenResponse))
  logInfo('accessToken ' + JSON.stringify(accessToken))

  if(authTokenResponse)
  {
    const userTokenResponse = await axios({
        ...axiosRequestConfig,
        data: EncodedData,
        headers: { 
             Authorization : `Bearer ${accessToken}`
        },
        method: 'GET',
        
        url: API_END_POINTS.verfifyToken,
      })
    logInfo("userTokenResponse : ", JSON.stringify(userTokenResponse))  
    return userTokenResponse
  }
  
}