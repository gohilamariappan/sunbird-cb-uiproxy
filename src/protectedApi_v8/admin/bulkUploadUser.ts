// import assert from 'assert';
//  import axios from 'axios'
import { Router } from 'express'
import { logInfo } from '../../utils/logger'
 import * as fs from 'fs'
import axios from 'axios';
import { axiosRequestConfig } from '../../configs/request.config'
 import { parse } from 'csv-parse';
import { CONSTANTS } from '../../utils/env'
import { extractUserToken } from '../../utils/requestExtract'


// // tslint:disable-next-line: max-line-length
// const emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/
// const nameRegex = /^[a-zA-Z\s\']{1,32}$/

const API_ENDPOINTS = {
    createUserOfBulkUpload: `${CONSTANTS.USER_PROFILE_API_BASE}/api/user/v3/create`,
    assignRoleforBulkUsers: `${CONSTANTS.USER_PROFILE_API_BASE}/api/user/v1/role/assign`,
}

// import {
//     createKeycloakUser,
//     getAuthToken,
//     sendActionsEmail,
//     UpdateKeycloakUserPassword,
// } from '../../utils/keycloak-user-creation'


export const bulkUploadUserApi = Router()


bulkUploadUserApi.post('/create-users', async(req, res) => {
	
	try 
	{
		const result =[]
		if (req.files == undefined) 
		{
				return res.status(400).send({
						message: "Please upload a CSV file!"
				});
		}
		// fs.readFile(req.body.userData, "utf-8", async (err: any, data: any) => {
		// if (err) console.log("Error in checking >>>>>>>>"+err);
		// else logInfo("data================="+data);
		// logInfo("Checking request files :>>>>>>"+req.files)
		
		fs.createReadStream(req.body.userData, "utf-8")
		.pipe(parse())
		.on("data", async (data) => {
			result.push(data);
		

		const resp1 = await   axios({
					...axiosRequestConfig,
					headers: {
						Authorization: CONSTANTS.SB_API_KEY,
						// tslint:disable-next-line: all
						'x-authenticated-user-token': extractUserToken(req)
					},
					method: 'POST',
					data: {
						"request": {
							                            "phone": data.mobile,
							                            "firstName": data.first_name,
							                            "lastName": data.last_name,
							                            "password": process.env.PASSWORD,// Any predefined password can be set for the users for first time login
							                            "channel": process.env.CHANNEL// Channel need to be provided
							                        },
					url: API_ENDPOINTS.createUserOfBulkUpload
					}
                });
	
		if(resp1)
		{
			const resp2 = await   axios({
				...axiosRequestConfig,
				headers: {
					Authorization: CONSTANTS.SB_API_KEY,
					// tslint:disable-next-line: all
					'x-authenticated-user-token': extractUserToken(req)
				},
				method: 'POST',
				data: {
					                        "request": {
					                            "userId": resp1.data.result.userId,
					                            "organisationId": "",// Pre-defined organisatin id
					                            "roles": [
					                                "PUBLIC"
					                            ]
					                        },
				url: API_ENDPOINTS.createUserOfBulkUpload
				}
                });

		logInfo("Check req data : "+resp2)
		}
	})
		
			
	}
	catch (error) 
	{
			console.log("catch error-", error);
			res.status(500).send({
					message: "Could not upload the file: ",
			});
			return res.status(200).send("Successfully entered")
	}
	
	
	return res.status(200).send("Siccess")
});

