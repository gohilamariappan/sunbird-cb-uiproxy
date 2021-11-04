import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
import { extractUserToken } from '../utils/requestExtract'

const API_END_POINTS = {
    kongSearchUser: `${CONSTANTS.KONG_API_BASE}/user/v1/search`,
    kongUserResetPassword: `${CONSTANTS.KONG_API_BASE}/private/user/v1/password/reset`,
  }

const uuidv1            = require('uuid/v1')
const dateFormat        = require('dateformat')
const emailAdressExist = 'Email address already exist'

export const forgotPassword = Router()

forgotPassword.post('/verify', async (req, res) => {
    logInfo('Entered into forgot password')
    try {
        const sbemail_ = req.body.personalDetails.email
        logInfo('URL Passing : ', req.body.personalDetails.email)
        const searchresponse = await axios({
            ...axiosRequestConfig,
            data: { request: { query: '', filters: { email: sbemail_.toLowerCase() } } },
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
                // tslint:disable-next-line: all
                'x-authenticated-user-token': extractUserToken(req)
            },
            method: 'POST',
            url: API_END_POINTS.kongSearchUser,
        })
        logInfo('Email Data : ', req.body.personalDetails.email)

        const sbUserId = searchresponse.data.result.userId
        const passwordResetRequest = {
            key: 'email',
            type: 'email',
            userId: sbUserId,
        }

        if (searchresponse.data.result.response.count > 0) {
            logInfo('Entered into Search Response')

            const passwordResetResponse = await axios({
                ...axiosRequestConfig,
                data: { request: passwordResetRequest },
                headers: {
                    Authorization: CONSTANTS.SB_API_KEY,
                },
                method: 'POST',
                url: API_END_POINTS.kongUserResetPassword,
            })
            logInfo('Received response from password reset -> ' + passwordResetResponse)
            if (passwordResetResponse.data.params.status === 'success') {
                logInfo('Reset password', passwordResetResponse.data.params.status)
                res.status(200).send('User password reset successfully !!')
            }

            // res.status(400).send(
            // {
            //     id: 'api.error.createUser',
            //     ver: '1.0',
            //     // tslint:disable-next-line: object-literal-sort-keys
            //     ts: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss:lo'),
            //     params:
            //     {
            //         resmsgid: uuidv1(),
            //         // tslint:disable-next-line: object-literal-sort-keys
            //         msgid: null,
            //         status: 'failed',
            //         err: 'USR_EMAIL_EXISTS',
            //         errmsg: emailAdressExist,
            //     },
            //     responseCode: 'USR_EMAIL_EXISTS',
            //     result: {},
            // })
            return
        } else {
            res.status(400).send(
            {
                id: 'api.error.createUser',
                ver: '1.0',
                // tslint:disable-next-line: object-literal-sort-keys
                ts: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss:lo'),
                params:
                {
                    resmsgid: uuidv1(),
                    // tslint:disable-next-line: object-literal-sort-keys
                    msgid: null,
                    status: 'failed',
                    err: 'USR_EMAIL_DOESNT_EXISTS',
                    errmsg: emailAdressExist,
                },
                responseCode: 'USR_EMAIL_DOESNT_EXISTS',
                message : 'User email doesnot exist !!',
                result: {},
            })
        }

    } catch (err) {
        logError('Error failing the call' + err)
    }
})
