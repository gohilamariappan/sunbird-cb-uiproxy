import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
                        searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
                        }

export const forgotPassword = Router()

forgotPassword.post('/reset/proxy/password', async (req, res) => {
    logInfo('Entered into reset password ')
    try {
        logInfo('Entered into try block ')
        const sbemail = req.body.email

        logInfo('Entered into try block email : ', sbemail)

        const searchresponse = await axios({
            ...axiosRequestConfig,
            data: { request: { query: '', filters: { email: sbemail.toLowerCase() } } },
            method: 'POST',
            url: API_END_POINTS.searchSb,
        })
        if (searchresponse.data.result.response.count > 0) {
            res.status(200).send({userId :searchresponse.data.result.response.content.userId, message : "success"})
            return
        }

    } catch (err) {
        logError('ERROR CREATING USER REGISTRY > ' + err)
        res.status(500).send('Error ' + err)
    }
})
