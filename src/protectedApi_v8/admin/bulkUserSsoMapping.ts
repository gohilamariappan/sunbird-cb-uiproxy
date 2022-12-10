import axios from 'axios'
import { Router } from 'express'
import _ from 'lodash'
// import {v4 as uuidv4} from 'uuid'
import { axiosRequestConfig } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logInfo } from '../../utils/logger'
// import { extractUserToken } from '../../utils/requestExtract'
// import { bulkExtendedMethod, saveExtendedData } from './bulkExtendedMethod'
// const cassandra = require('cassandra-driver')

const API_ENDPOINTS = {
    kongUserSearch: `${CONSTANTS.KONG_API_BASE}/user/v1/search`,
}

// const client = new cassandra.Client({
//         contactPoints: [CONSTANTS.CASSANDRA_IP],
//         keyspace: 'sunbird',
//         localDataCenter: 'datacenter1',
//     })

// tslint:disable-next-line: no-any
// const finalResponse: any = []
// const uniqueSSOuserId = uuidv4()

export const bulkUserSsoMappingApi = Router()

/* tslint:disable-next-line */
bulkUserSsoMappingApi.post('/provider', async (req: any, _res) => {
    try {
        const fileData = req.files.userData.data.toString('utf8')
        const lines = fileData.split('\n')
        // tslint:disable-next-line: no-any
        const result: any = []
        const createdUserId: any = []
        // NOTE: If your columns contain commas in their values, you'll need
        const headers = lines[0].split(',')
        for (let i = 1; i < lines.length; i++) {
            const obj = {}
            const currentline = lines[i].split(',')
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j]
           // logInfo("obj[headers[j]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+obj[headers[j]])
            }
            result.push(obj)
            //logInfo("result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+JSON.stringify(result))
            result.forEach(async csvElement => {
                logInfo("result.UserID >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+csvElement.UserID)
              //  logInfo("result.UserID >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+csvElement.phone ? csvElement.phone : csvElement.username)
                //logInfo("result.UserID >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+csvElement.type ? csvElement.phone : csvElement.username)
                let usernameType = csvElement.type
                let username = csvElement.username
                try {
                    const userSearch = await axios({
                        ...axiosRequestConfig,
                        data: {
                          request: {
                            filters:  { [usernameType] : username },
                          },
                        },
                        method: 'POST',
                        url: API_ENDPOINTS.kongUserSearch,
                    })
                    logInfo('userSearch response >>>>>>>>>>>>>>>' + userSearch)
                    if (userSearch.data.result.response) {
                        if (userSearch.data.result.response.count > 0) {
                          const userUUId = _.get(  _.find(userSearch.data.result.response.content, 'userId'), 'userId' )
                          const orgId =  userSearch.data.result.response.organisations[0].organisationId
                         
                          logInfo("userUUId >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+userUUId)
                          logInfo("orgId >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+orgId)
                        // try{
                        //             // tslint:disable-next-line: max-line-length
                        //             // const query = 'INSERT INTO sunbird.user_sso_bulkupload ( id, code, mainuseruuid, orgid, status, shashaktUserId, provider) VALUES ( ?, ?, ?, ?, ?, ?, ? )'
                        //             // // tslint:disable-next-line: max-line-length
                        //             // const params = [ uniqueSSOuserId,  csvElement.Cadre, userUUId, '0134142791060684801',  'success', csvElement.UserID, 'TEST'  ]
                        //             // // Set the prepare flag in the query options
                        //             // const resultSSOUser = client.execute(query, params, { prepare: true })
                        //             // .then(resultQueryExecution => {
                        //             //     createdUserId.push(csvElement.UserID)
                        //             //     console.log('resultQueryExecution >>>>>>>>>>>>>>>>>>>>>>>>.' + resultQueryExecution); 
                        //             // });
                        //             // logInfo('Successful ! query executed  : ' + resultSSOUser)
                        //     }catch (error) {
                        //         logInfo('Failed in execution of query ' + error)
                        //     }
                        }
                    }

                  
                }catch (error) {
                    logInfo('Failed in fetching UserId ' + error)
                }
          });
        }
        logInfo("Result length >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+result.length)
        if (result.length > 0) {
            _res.status(200).send({
                message: 'Bulk Upload is Completed ! ',
                status : 'success',
                successUserIds : createdUserId
            })
         }else{
            _res.status(404).send({
                message: 'No Data found in bulk upload ! plz check if UserId present.',
                status : 'warning',
            })
         }
    } catch (error) {
        logInfo('catch error-' + error)
        _res.status(500).send({
            message: 'Could not upload the file: ',
        })
    }
 })