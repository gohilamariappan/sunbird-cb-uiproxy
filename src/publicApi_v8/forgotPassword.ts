
import axios from 'axios'
import { Router } from 'express'
import { CONSTANTS } from '../utils/env'
import { axiosRequestConfig } from '../configs/request.config';
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
                        searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
                        }    

export const forgotPassword = Router()

forgotPassword.post('/reset/proxy/password', async (req, res) => {
    logInfo("Entered into reset password ") 
    try
    {
        logInfo("Entered into try block ")
        const sbemail = req.body.email

        logInfo("Entered into try block email : ", sbemail)
        
        const searchresponse = await axios({
            ...axiosRequestConfig,
            data: { request: { query: '', filters: { email: sbemail.toLowerCase() } } },
            method: 'POST',
            url: API_END_POINTS.searchSb,
        })
        logInfo("Entered into reset password "+ searchresponse)    
        res.status(200).send("Success in search User !! ")
        return  

    }catch (err) {
        logError('ERROR CREATING USER REGISTRY > '+ err)
        res.status(500).send("Error "+err) 
    }
})        

