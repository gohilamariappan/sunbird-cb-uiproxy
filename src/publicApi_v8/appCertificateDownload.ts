import axios from 'axios'
import { Router } from 'express'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
  DOWNLOAD_CERTIFICATE: `${CONSTANTS.HTTPS_HOST}/apis/proxies/v8/certreg/v2/certs/download/`,
}
const VALIDATION_FAIL =
  'Sorry ! Download cerificate not worked . Please try again in sometime.'
export const appCertificateDownload = Router()

appCertificateDownload.get('/download', async (req, res) => {
  try {
    const certificateId = req.query.certificateId
    const userCookie = req.headers.cookie
    if (!certificateId) {
      res.status(400).json({
        msg: 'Certificate ID can not be empty',
        status: 'error',
        status_code: 400,
      })
    }
    const response = await axios({
      ...axiosRequestConfig,
      headers: {
        cookie: userCookie,
      },
      method: 'GET',
      url: `${API_END_POINTS.DOWNLOAD_CERTIFICATE}${certificateId}`,
    })
    logInfo(
      'Certificate download in progress of certificate ID',
      certificateId
    )
    if (response.data.responseCode === 'OK') {
      logInfo('Certificate printURI received :')
      fs.writeFile(
        'certificate.svg',
        JSON.stringify(response.data.result.printUri),
        (err) => {
          // throws an error, you could also catch it here
          if (err) throw err
          // success case, the file was saved
        }
      )
      const fileLocation = (
        path.join(__dirname, '../') + 'certificate.svg'
      ).replace(/\\/g, '/')

      res.download(fileLocation, (err) => {
        if (err) {
          // tslint:disable-next-line: no-console
          console.log(err)
        }
      })
    } else {
      throw new Error(
        _.get(response.data, 'params.errmsg') ||
          _.get(response.data, 'params.err')
      )
    }
  } catch (error) {
    logError('Error in validate certificate  >>>>>>' + error)
    res.status(500).send({
      message: VALIDATION_FAIL,
      status: 'failed',
    })
  }
})
