
import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logInfo } from '../../utils/logger'

const API_ENDPOINTS = {
    assignRoleforBulkUsers: `${CONSTANTS.USER_PROFILE_API_BASE}/api/user/v1/role/assign`,
    createUserOfBulkUpload: `${CONSTANTS.USER_PROFILE_API_BASE}/api/user/v3/create`,
}

export const bulkUploadUserApi = Router()

bulkUploadUserApi.post('/create-users', async (req: any, res) => {

	try {
		const fileData = req.files.userData.data.toString('utf8')
		logInfo('files recived >>>>>>>>> ' + fileData)
		const lines = fileData.split('\n')
	 logInfo('Linesdata >>>>>' + lines)
		const result = []

		// NOTE: If your columns contain commas in their values, you'll need
		const headers = lines[0].split(',')
		logInfo('lines.length >>>>>>' + lines.length)
		for (let i = 1; i < lines.length; i++) {

			const obj = {}
			const currentline = lines[i].split(',')
	  for (let j = 0; j < headers.length; j++) {
				obj[headers[j]] = currentline[j]
			}

			result.push(obj)
		}

		const finalResult = result.map(async (csvObjData: any) => {

			logInfo('Entered into CSV object data >>>>>', JSON.stringify(csvObjData))

			const collectData = {
				firstName: csvObjData.first_name,
				lastName: csvObjData.last_name,
				// username: csvObjData.username,
				[csvObjData.type]: csvObjData.phone ? csvObjData.phone : csvObjData.username,
				password: process.env.PASSWORD,
				roles : csvObjData.roles,
				usertype : csvObjData.usertype,
			}

			logInfo('collectData >>>>>' + JSON.stringify(collectData))

			const responseUserCreation = await axios({
				...axiosRequestConfig,
				data: {  request: collectData },
				headers: {
				  Authorization: CONSTANTS.SB_API_KEY,
				},
				method: 'POST',
				url: API_ENDPOINTS.createUserOfBulkUpload,
			  })
			logInfo('Check user creation >> ' + responseUserCreation)

		})
		logInfo("Final result output for bulk upload : "+finalResult)
	} catch (error) {
			logInfo('catch error-' + error)
			res.status(500).send({
					message: 'Could not upload the file: ',
			})
	}
	return res.status(200).send('Success')

})
