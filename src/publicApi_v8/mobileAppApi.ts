import axios from 'axios'
import { Router } from 'express'
import jwt_decode from 'jwt-decode'
import request from 'request'
import { assessmentCreator } from '../utils/assessmentSubmitHelper'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
import { getCurrentUserRoles } from './rolePermission'

const API_END_POINTS = {
  GET_ALL_ENTITY: `${CONSTANTS.ENTITY_API_BASE}/getAllEntity`,
  GET_ENTITY_BY_ID: `${CONSTANTS.ENTITY_API_BASE}/getEntityById/`,
}
const GET_ENTITY_BY_ID_FAIL =
  "Sorry ! couldn't get entity for the respective ID."
const GET_ALL_ENTITY_FAIL = "Sorry ! couldn't get all the entity"

const authenticatedToken = 'x-authenticated-user-token'
export const mobileAppApi = Router()

// tslint:disable-next-line: no-any
const verifyToken = (req: any, res: any) => {
  try {
    const accessToken = req.headers[authenticatedToken]
    // tslint:disable-next-line: no-any
    const decodedToken: any = jwt_decode(accessToken.toString())
    const decodedTokenArray = decodedToken.sub.split(':')
    const userId = decodedTokenArray[decodedTokenArray.length - 1]
    return {
      accessToken,
      decodedToken,
      status: 200,
      userId,
    }
  } catch (error) {
    return res.status(404).json({
      message: 'User token missing or invalid',
      redirectUrl: 'https://sphere.aastrika.org/public/home',
    })
  }
}
mobileAppApi.get('/getContents/*', (req, res) => {
  try {
    const path = removePrefix(
      '/public/v8/mobileApp/getContents/',
      req.originalUrl
    )
    const sunbirdUrl = CONSTANTS.S3_BUCKET_URL + path
    logInfo(
      'New getcontents sunbird URL for Mobile APP >>>>>>>>>>> ',
      sunbirdUrl
    )
    return request(sunbirdUrl).pipe(res)
  } catch (err) {
    res.status(404).json({
      message: 'Content not found',
    })
  }
})

mobileAppApi.post('/submitAssessment', async (req, res) => {
  try {
    const accesTokenResult = verifyToken(req, res)
    if (accesTokenResult.status == 200) {
      const accessToken = accesTokenResult.accessToken
      const userId = accesTokenResult.userId
      const assessmentSubmitStatus = await assessmentCreator(
        req.body,
        accessToken,
        userId
      )
      res
        .status(assessmentSubmitStatus.status)
        .json(assessmentSubmitStatus.data)
    }
  } catch (err) {
    res.status(404).json({
      message: 'Error occured while submit',
    })
  }
})
// tslint:disable-next-line: no-any
mobileAppApi.get('/webviewLogin', async (req: any, res) => {
  const accesTokenResult = verifyToken(req, res)
  const accessToken = accesTokenResult.accessToken
  const decodedToken = accesTokenResult.decodedToken
  const userId = accesTokenResult.userId
  if (accesTokenResult.status == 200) {
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
    res.status(200).json({
      message: 'success',
      redirectUrl: 'https://sphere.aastrika.org/app/profile-view',
    })
  }
})
mobileAppApi.post('/getEntityById/:id', async (req, res) => {
  try {
    const accesTokenResult = verifyToken(req, res)
    if (accesTokenResult.status == 200) {
      const response = await axios({
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          authenticatedToken: req.headers[authenticatedToken],
        },
        method: 'POST',
        url: `${API_END_POINTS.GET_ENTITY_BY_ID}+${req.params.id}`,
      })
      logInfo('Check req body of getEntityByID >> ' + req.body)
      res.status(response.data.responseCode).send(response.data)
    }
  } catch (error) {
    logError('Error in getEntityById  >>>>>>' + error)
    res.status(500).send({
      message: GET_ENTITY_BY_ID_FAIL,
      status: 'failed',
    })
  }
})
mobileAppApi.post('/getAllEntity', async (req, res) => {
  try {
    const accesTokenResult = verifyToken(req, res)
    if (accesTokenResult.status == 200) {
      const response = await axios({
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          authenticatedToken: req.headers[authenticatedToken],
        },
        method: 'POST',
        url: API_END_POINTS.GET_ALL_ENTITY,
      })
      logInfo('Check req body of getAllEntity >> ' + req.body)
      res.status(response.data.responseCode).send(response.data)
    }
  } catch (error) {
    logError('Error in GET_ALL_ENTITY  >>>>>>' + error)
    res.status(500).send({
      message: GET_ALL_ENTITY_FAIL,
      status: 'failed',
    })
  }
})
function removePrefix(prefix: string, s: string) {
  return s.substr(prefix.length)
}
