
import axios from 'axios'
import { Router } from 'express'
import { extractUserToken } from '../../utils/requestExtract'
import { axiosRequestConfig } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logInfo } from '../../utils/logger'

const API_ENDPOINTS = {
    assignRoleforBulkUsers: `${CONSTANTS.SUNBIRD_PROXY_API_BASE}/user/v1/role/assign`,
    createUserOfBulkUpload: `${CONSTANTS.KONG_API_BASE}/user/v3/create`,
}


export const bulkUploadUserApi = Router()

bulkUploadUserApi.post('/create-users', async (req: any, _res) => {

    try {
        const fileData = req.files.userData.data.toString('utf8')
       // logInfo('files recived >>>>>>>>> ' + fileData)
        const lines = fileData.split('\n')
       // logInfo('Linesdata >>>>>' + lines)
        const result : any = []

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
    

    const userProcessing = async () => { 
        try{
            let finalPromiseResolve = []
            let data = await (Promise as any).allSettled(result.map(async (csvObjects:any) => {
                return await simulateFetchData(csvObjects)
            }))
           
            logInfo("Data inside user processing >>>>> " + data)
            logInfo("Final Data inside user processing >>>>> " + finalPromiseResolve.push(data))    

            _res.status(200).send({
                message: 'Bulk Upload is Completed ! ',
                data : finalPromiseResolve.push(data)
            })
        }catch (error) {
            logInfo('Calling User Processing  : '+ error)
            _res.status(500).send({
                    message: 'Error While Creating the user ',
            })
        }
    }
   
    
    const simulateFetchData = async(csvObjects:any)=>{
       try{
        
        
        if(csvObjects.first_name)
        {
          
        const collectData = {
                                firstName: csvObjects.first_name,
                                lastName: csvObjects.last_name,
                                // username: csvObjData.username,
                                [csvObjects.type]: csvObjects.phone ? csvObjects.phone : csvObjects.username,
                                password: process.env.PASSWORD,
                                usertype: csvObjects.usertype,
                            }

        logInfo('collectData >>>>>' + JSON.stringify(collectData))


        const responseUserCreation = await axios({
                                                ...axiosRequestConfig,
                                                            data: { request: collectData },
                                                            headers: {
                                                                Authorization: CONSTANTS.SB_API_KEY,
                                                            },
                                                            method: 'POST',
                                                            url: API_ENDPOINTS.createUserOfBulkUpload,
                                                  })
          //  logInfo("Response usercreation >>>>>>>>>>"+ JSON.stringify(responseUserCreation))                             
        if (responseUserCreation) {
            logInfo("Entered into Assign role >>")
            const responseRoleAssign = await axios({
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
                                            url: API_ENDPOINTS.assignRoleforBulkUsers,
                                            },
                                        })
        logInfo("Final collective data >>>> " + responseRoleAssign)
       // logInfo("Final collective data >>>> " + JSON.stringify(responseRoleAssign))
                                    }
                                      
        }
        
         }catch (error) {
            logInfo('Error While Creating the user & assigning role : '+ error)
            _res.status(500).send({
                    message: 'Error While Creating the user ',
            })
        }
        

    }
    if(result.length>1)
    {
        userProcessing();   
    }  

} catch (error) {
    logInfo('catch error-'+ error)
    _res.status(500).send({
            message: 'Could not upload the file: ',
    })
}


})



