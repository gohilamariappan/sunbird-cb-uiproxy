
import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig, axiosRequestConfigLong } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logInfo } from '../../utils/logger'
import { extractUserToken } from '../../utils/requestExtract'
import { bulkExtendedMethod, saveExtendedData } from './bulkExtendedMethod'

const API_ENDPOINTS = {
    assignRoleforBulkUsers: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/user/v1/role/assign`,
    createUserOfBulkUpload: `${CONSTANTS.KONG_API_BASE}/user/v3/create`,
    kongSendWelcomeEmail: `${CONSTANTS.KONG_API_BASE}/private/user/v1/notification/email`,
    kongUserResetPassword: `${CONSTANTS.KONG_API_BASE}/private/user/v1/password/reset`,
}

const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['9043'], localDataCenter: 'localhost', keyspace: 'sunbird' });


// tslint:disable-next-line: no-any
const finalResponse: any = []

export const bulkUploadUserApi = Router()

// tslint:disable-next-line: no-any
bulkUploadUserApi.post('/create-users', async (req: any, _res) => {
    try {
        const fileData = req.files.userData.data.toString('utf8')
        const lines = fileData.split('\n')
        // tslint:disable-next-line: no-any
        const result: any = []
        // NOTE: If your columns contain commas in their values, you'll need
        const headers = lines[0].split(',')
        for (let i = 1; i < lines.length; i++) {
            const obj = {}
            const currentline = lines[i].split(',')
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j]
            }
            result.push(obj)
        }
        console.log("Result >>>>>>>>>>>>>>>>>>>>>>>"+result)
        const userProcessing = async () => {
            try {
                // tslint:disable-next-line: no-any
                const data = await (Promise as any).allSettled(result.map(async (csvObjects: any) => {
                    console.log("Checking csvObjects values >>>>>>>>>>>>>>>>>"+csvObjects.Cadre.toUpperCase())
                    if(csvObjects.Cadre.toUpperCase() === 'ASHAS')
                    {
                        return saveAshaWorkerData(csvObjects)
                    }else {
                        return simulateFetchData(csvObjects)
                    }
                }))
                logInfo('Data inside user processing >>>>> ' + data)
                _res.status(200).send({
                                            message: 'Bulk Upload is Completed ! ',
                                            status : 'success',
                                        })
            } catch (error) {
                logInfo('Calling User Processing  : ' + error)
                _res.status(500).send({
                    message: 'Error While Creating the user ',
                })
            }
        }

        // tslint:disable-next-line: no-any
        const simulateFetchData = async (csvObjects: any) => {
            try {
                if (csvObjects.first_name) {
                //     if(csvObjects.cadre === '')
                    logInfo('CSV data present more than one row')
                    const collectData = {
                        channel: csvObjects.channel,
                        firstName: csvObjects.first_name,
                        lastName: csvObjects.last_name,
                        [csvObjects.type]: csvObjects.phone ? csvObjects.phone : csvObjects.username,
                        password: process.env.PASSWORD,
                        username: csvObjects.username,
                        usertype: csvObjects.usertype,
                    }
                    logInfo('collectData coming >>>>>' + JSON.stringify(collectData))
                    try {
                        const responseUserCreation = await axios({
                            ...axiosRequestConfig,
                            data: { request: collectData },
                            headers: {
                                Authorization: CONSTANTS.SB_API_KEY,
                            },
                            method: 'POST',
                            url: API_ENDPOINTS.createUserOfBulkUpload,
                        })
                        logInfo('UserId after creation >>>>>' + responseUserCreation.data.result.userId)
                        if (responseUserCreation) {
                            logInfo('99. Response user creation >>>>>>>' + responseUserCreation)
                            finalResponse.push(responseUserCreation)
                            const readUrl = `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/user/v2/read/` + responseUserCreation.data.result.userId
                            logInfo('readUrl  >>>>>>>>>>>>>>>>> : ' + readUrl)
                            try {
                                const readApiResponse = await axios({
                                    ...axiosRequestConfig,
                                    headers: {
                                        Authorization: CONSTANTS.SB_API_KEY,
                                        'X-Channel-Id': CONSTANTS.X_Channel_Id,
                                        'x-authenticated-user-token': extractUserToken(req),
                                        'x-authenticated-userid': responseUserCreation.data.result.userId,
                                      },
                                    method: 'GET',
                                    url: readUrl,
                                })
                                // tslint:disable-next-line: no-any
                                logInfo('readApiResponse >>>>>>>> :' + readApiResponse)
                                const roleData = {
                                    // tslint:disable-next-line: max-line-length
                                    organisationId: readApiResponse.data.result.response.organisations[0].organisationId,
                                    roles: [
                                        'PUBLIC',
                                    ],
                                    userId: responseUserCreation.data.result.userId,
                                }

                                logInfo('Organisation id >>>>>>>> :' + readApiResponse.data.result.response.organisations[0])
                                logInfo('roleData for assigning >>>>>>>> :' + JSON.stringify(roleData))
                                try {
                                const responseRoleAssign = await axios({
                                        ...axiosRequestConfigLong,
                                        data: { request: roleData },
                                        headers: {
                                            Authorization: CONSTANTS.SB_API_KEY,
                                            // tslint:disable-next-line: all
                                            'x-authenticated-user-token': extractUserToken(req)
                                        },
                                        method: 'POST',
                                        url: API_ENDPOINTS.assignRoleforBulkUsers,
                                    })
                                logInfo('Role Assigned data >>>> ' + responseRoleAssign)
                                finalResponse.push(responseRoleAssign)
                                const resultBulkUploadMethod = await bulkExtendedMethod(csvObjects, responseUserCreation.data.result.userId)
                                logInfo('resultBulkUploadMethod 22222 >>>>>' + JSON.stringify(resultBulkUploadMethod))
                                try {
                                    const passwordResetRequest = {
                                        key: 'email',
                                        type: 'email',
                                        userId: responseUserCreation.data.result.userId,
                                      }
                                    logInfo('Sending Password reset request -> ' + passwordResetRequest)
                                    const passwordResetResponse = await axios({
                                        ...axiosRequestConfig,
                                        data: { request: passwordResetRequest },
                                        headers: {
                                          Authorization: CONSTANTS.SB_API_KEY,
                                        },
                                        method: 'POST',
                                        url: API_ENDPOINTS.kongUserResetPassword,
                                      })
                                    logInfo('Received response from password reset -> ' + passwordResetResponse)

                                    try {
                                        logInfo('Welcome Mail Request body')
                                        const welcomeMailRequest = {
                                            allowedLoging: 'You can use your email to Login. Click on link and activate your account.',
                                            body: 'Hello',
                                            emailTemplateType: 'iGotWelcome',
                                            firstName: csvObjects.first_name,
                                            link: passwordResetResponse.data.result.link,
                                            mode: 'email',
                                            orgName: 'Sphere test 1',
                                            recipientEmails: [csvObjects.username],
                                            setPasswordLink: true,
                                            subject: 'Welcome Email',
                                            welcomeMessage: 'Hello',
                                          }
                                        logInfo('Welcome Mail Request body data' + JSON.stringify(welcomeMailRequest))
                                        const welcomeMailResponse = await axios({
                                            ...axiosRequestConfig,
                                            data: { request: welcomeMailRequest },
                                            headers: {
                                                Authorization: CONSTANTS.SB_API_KEY,
                                            },
                                            method: 'POST',
                                            url: API_ENDPOINTS.kongSendWelcomeEmail,
                                            })

                                        if (welcomeMailResponse.data.params.status !== 'success') {
                                            logInfo('Failed to send Welcome Email.')
                                        }

                                        return finalResponse
                                    } catch (error) {
                                        logInfo('Error While sending the mail  : ' + error)
                                    }
                                } catch (error) {
                                    logInfo('Error While resetting password in generating link  : ' + error)
                                }
                            } catch (error) {
                                logInfo('Error While assign  the role  : ' + error)
                            }
                            } catch (error) {
                                logInfo('Error While getting read api data  : ' + error)
                            }
                        }
                    } catch (error) {
                        logInfo('Error While Creating the user  : ' + error)
                    }
                }
            } catch (error) {
                logInfo('Error While Creating the user & assigning role : ' + error)
            }
        }

        const saveAshaWorkerData = async (csvObjects: any) => {
            try {
                if (csvObjects.first_name) {
                //     if(csvObjects.cadre === '')
                    logInfo('CSV data present more than one row')
                    const collectData = {
                        channel: csvObjects.channel,
                        firstName: csvObjects.first_name,
                        lastName: csvObjects.last_name,
                        [csvObjects.type]: csvObjects.phone ? csvObjects.phone : csvObjects.username,
                        password: CONSTANTS.BULK_USER,
                        username: csvObjects.username,
                    }
                    logInfo('collectData coming >>>>>' + JSON.stringify(collectData))
                    try {
                        const responseUserCreation = await axios({
                            ...axiosRequestConfig,
                            data: { request: collectData },
                            headers: {
                                Authorization: CONSTANTS.SB_API_KEY,
                            },
                            method: 'POST',
                            url: API_ENDPOINTS.createUserOfBulkUpload,
                        })
                        logInfo('UserId after creation >>>>>' + responseUserCreation.data.result.userId)
                        if (responseUserCreation) {
                            logInfo('99. Response user creation >>>>>>>' + responseUserCreation)
                            finalResponse.push(responseUserCreation)
                            const readUrl = `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/user/v2/read/` + responseUserCreation.data.result.userId
                            logInfo('readUrl  >>>>>>>>>>>>>>>>> : ' + readUrl)
                            try {
                                const readApiResponse = await axios({
                                    ...axiosRequestConfig,
                                    headers: {
                                        Authorization: CONSTANTS.SB_API_KEY,
                                        'X-Channel-Id': CONSTANTS.X_Channel_Id,
                                        'x-authenticated-user-token': extractUserToken(req),
                                        'x-authenticated-userid': responseUserCreation.data.result.userId,
                                      },
                                    method: 'GET',
                                    url: readUrl,
                                })
                                // tslint:disable-next-line: no-any
                                logInfo('readApiResponse >>>>>>>> :' + readApiResponse)
                                const roleData = {
                                    // tslint:disable-next-line: max-line-length
                                    organisationId: readApiResponse.data.result.response.organisations[0].organisationId,
                                    roles: [
                                        'PUBLIC',
                                    ],
                                    userId: responseUserCreation.data.result.userId,
                                }

                                logInfo('Organisation id >>>>>>>> :' + readApiResponse.data.result.response.organisations[0])
                                logInfo('roleData for assigning >>>>>>>> :' + JSON.stringify(roleData))
                                try {
                                const responseRoleAssign = await axios({
                                        ...axiosRequestConfigLong,
                                        data: { request: roleData },
                                        headers: {
                                            Authorization: CONSTANTS.SB_API_KEY,
                                            // tslint:disable-next-line: all
                                            'x-authenticated-user-token': extractUserToken(req)
                                        },
                                        method: 'POST',
                                        url: API_ENDPOINTS.assignRoleforBulkUsers,
                                    })
                                logInfo('Role Assigned data >>>> ' + responseRoleAssign)
                                finalResponse.push(responseRoleAssign)
                                const resultBulkUploadMethod = await saveExtendedData(csvObjects, responseUserCreation.data.result.userId)
                                logInfo('resultBulkUploadMethod  >>>>>' + JSON.stringify(resultBulkUploadMethod))
                               try{
                                // SSOUserId taking integer value for creating unique primary key for ashas user.
                                let ssoUserId = Date.now()
                                const query = 'INSERT INTO sunbird.user_sso_bulkupload ( id, externalId, mainUserUuid, code, status) VALUES ( ?, ?, ?, ?, ? )'; 
                                const params = [ ssoUserId, readApiResponse.data.result.response.organisations[0],  responseUserCreation.data.result.userId,  csvObjects.Cadre, '1' ];
                                // Set the prepare flag in the query options
                                const resultSSOUser = client.execute(query, params, { prepare: true })
                                logInfo('Successful ! User creation completed via SaveExtended Method : ' + resultSSOUser)
                            
                               } catch (error){
                                logInfo('Error While inserting in cassandra table user_sso_bulkupload  : ' + error)
                               }
                            } catch (error) {
                                logInfo('Error While assign  the role  : ' + error)
                            }
                            } catch (error) {
                                logInfo('Error While getting read api data  : ' + error)
                            }
                        }
                    } catch (error) {
                        logInfo('Error While Creating the user  : ' + error)
                    }
                }
            } catch (error) {
                logInfo('Error While Creating the user & assigning role : ' + error)
            }
        }
        if (result.length > 1) {
           userProcessing()
        }

    } catch (error) {
        logInfo('catch error-' + error)
        _res.status(500).send({
            message: 'Could not upload the file: ',
        })
    }
})

