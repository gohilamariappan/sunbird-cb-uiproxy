
import axios from 'axios'
import { Router } from 'express'
import { extractUserToken } from '../../utils/requestExtract'
import { axiosRequestConfig } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logInfo } from '../../utils/logger'
//import { IBulkUploadCSV } from '../../../src/models/user.model'

// const API_ENDPOINTS = {
//     assignRoleforBulkUsers: `${CONSTANTS.USER_PROFILE_API_BASE}/api/user/v1/role/assign`,
//     createUserOfBulkUpload: `${CONSTANTS.USER_PROFILE_API_BASE}/api/user/v3/create`,
// }

type CsvObjectTypes ={
    first_name: string | "",
    last_name: string | "",
    username: string | "",
    usertype : string | "",
    type: string,
    channel : string,
    organisationId : number | "",
}


let finalResponse : []

export const bulkUploadUserApi = Router()

bulkUploadUserApi.post('/create-users', async (req: any, res) => {

    try {
        const fileData = req.files.userData.data.toString('utf8')
       // logInfo('files recived >>>>>>>>> ' + fileData)
        const lines = fileData.split('\n')
       // logInfo('Linesdata >>>>>' + lines)
        const result = []

        // NOTE: If your columns contain commas in their values, you'll need
        const headers = lines[0].split(',')
        //logInfo('lines.length >>>>>>' + lines.length)
        for (let i = 1; i < lines.length; i++) {

            const obj = {}
            const currentline = lines[i].split(',')
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j]
            }

            result.push(obj)
        }

        

       const finalResult = result.map(async (csvObjects: CsvObjectTypes) =>  {
            logInfo('Entered into CSV object data >>>>>', JSON.stringify(csvObjects))
            logInfo('Type of >>>>>>' + typeof(csvObjects))

            const collectData = {
                firstName: csvObjects.first_name,
                lastName: csvObjects.last_name,
                // username: csvObjData.username,
                [csvObjects.type]: csvObjects.phone ? csvObjects.phone : csvObjects.username,
                password: process.env.PASSWORD,
                usertype : csvObjects.usertype,
            }

            logInfo('collectData >>>>>' + JSON.stringify(collectData))


            const responseUserCreation = await axios({
                                     ...axiosRequestConfig,
                                        data: {  request: collectData },
                                        headers: {
                                        Authorization: CONSTANTS.SB_API_KEY,
                                        },
                                        method: 'POST',
                                       // url: API_ENDPOINTS.createUserOfBulkUpload,
                                    })
                                    
              if(responseUserCreation)
              {
                const responseRoleAssign = await   axios({
                    				...axiosRequestConfig,
                    				headers: {
                    					Authorization: CONSTANTS.SB_API_KEY,
                    					// tslint:disable-next-line: all
                    					'x-authenticated-user-token': extractUserToken(req)
                    				},
                    				method: 'POST',
                    				data: {
                    					    request: {
                    					         userId: responseUserCreation.data.result.userId,
                    					         organisationId: csvObjects.organisationId, // Pre-defined organisatin id
                    					          roles: [
                    					                 'PUBLIC',
                    					                    ],
                    					                 },
                    			//	url: API_ENDPOINTS.createUserOfBulkUpload,
                    				},
                                })
                logInfo("Final collective data >>>> "+responseRoleAssign)                
              }
            logInfo('Check user creation >> ' + responseUserCreation)

        })
        
        res.status(200).send({message : 'Bulk Records have successfully uploaded !!', data : finalResponse } )
        logInfo('Final result output for bulk upload : ' + finalResult)

    } catch (error) {
            logInfo('catch error-' + error)
            res.status(500).send({
                    message: 'Could not upload the file: ',
                    error : error
            })
    }

})


export interface IcsvObjectTypes {
    first_name: string,
    last_name: string,
    // username: csvObjData.username,
    phone: string,
    type: string,
    username: string,
    roles : string[],
    usertype : string,
}