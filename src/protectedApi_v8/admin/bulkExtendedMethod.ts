
import axios from 'axios'
//import { Router } from 'express'
import { axiosRequestConfig } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logInfo } from '../../utils/logger'
// import { extractUserToken } from '../../utils/requestExtract'

const API_ENDPOINTS = {
    kongUpdateUser: `${CONSTANTS.KONG_API_BASE}/user/private/v1/update`,
}

// tslint:disable-next-line: no-any
// const finalResponse: any = []
export const bulkExtendedMethod = async (
    // tslint:disable-next-line: no-any
    request: any,
    userId : string
  ) => {

    try {
        const updateProfileReq = {
            profileDetails: {
              id : userId,
              profileReq: {
                academics: [
                    {
                        nameOfQualification: request.nameOfQualification,
                        type:request.qualificationType,
                        nameOfInstitute: request.nameOfInstitute,
                        yearOfPassing: request.yearOfPassing
                    }
                ],
                employmentDetails: {
                  departmentName: request.organisationName,
                },
                interests: {
                    professional: request.profession,
                    hobbies: request.hobbies
                },
                personalDetails: {
                    firstname: request.first_name,
                    surname: request.last_name,
                    dob: request.dob,
                    regNurseRegMidwifeNumber: request.RN_Number,
                    countryCode: request.countryCode,
                    postalAddress: request.postalAddress
                },
                professionalDetails: [
                    {
                        orgType: request.orgType,
                        name: request.organisationName,
                        nameOther: request.institution_name,
                        designation: request.Designation,
                        profession: request.profession,
                        location: request.profileLocation,
                        completePostalAddress: request.postalAddress
                    }
                ],
                skills: {
                    additionalSkills: request.orgType,
                    certificateDetails: request.orgType
                },
              },
              preferences: {
                language: "en"
              },
            },
            userId: userId,
          }
          logInfo(">>>>>>  JSON Body of Update User profile >>>>>>>>>>>>> : "+JSON.stringify(request))
          const sbUserProfileUpdateResp = await axios({
            ...axiosRequestConfig,
            data: { request: updateProfileReq },
            headers: {
              Authorization: CONSTANTS.SB_API_KEY,
            },
            method: 'PATCH',
            url: API_ENDPOINTS.kongUpdateUser,
          })
          
            logInfo("Total CSVObjects in bulkextended are >>>>>>>>>>>>> : "+JSON.stringify(request))
            logInfo("UserId in bulkextended >>>>>>>>>>>>> : "+JSON.stringify(userId))
            logInfo("Total CSVObjects data are >>>>>>>>>>>>> : "+sbUserProfileUpdateResp)
        return request

    } catch (error) {
        logInfo('Warning ! Error While updating user profile of bulk upload after role assign  : ' + error)
    }

  
    // try {
    //   const updateBulkUserProfile = await axios({
    //     ...axiosRequestConfig,
    //     //data: encodedData,
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     method: 'POST',
    //     url: API_END_POINTS.generateToken,
    //   })
    // }
}