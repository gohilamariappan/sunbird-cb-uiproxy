import axios from 'axios'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'

const API_END_POINTS = {
  searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
}
<<<<<<< HEAD

try {

export const fetchUser = async (searchValue: string, searchType: string) => {
<<<<<<< HEAD
  logInfo('Search User - Entered in phone and value is : ', searchValue)
  logInfo('Search Type - Entered in phone and type is : ', searchType)
 
  const userSearchResponse = await axios({
    ...axiosRequestConfig,
    data: {
      request: {
        filters: { [searchType]: searchValue.toLowerCase() },
        query: '',
      },
    },
    headers: {
        Authorization: CONSTANTS.SB_API_KEY,
    },
    method: 'POST',
    url: API_END_POINTS.searchSb,
  })
  logInfo('Fetch User Response : ' + JSON.stringify(userSearchResponse))
  return userSearchResponse
}

} catch (err) {
    logError('ERROR FETCHING Search User ' + err)
}

=======
  logInfo("Search User endpoint proxy 11 : ", API_END_POINTS.searchSb);
  logInfo("Search User - searchType : ", searchType);
  logInfo("Search User - Entered in phone and value is : ", searchValue);
=======

export const fetchUser = async (searchValue: string, searchType: string) => {
  logInfo('Search User endpoint proxy 11 : ', API_END_POINTS.searchSb)
  logInfo('Search User - searchType : ', searchType)
  logInfo('Search User - Entered in phone and value is : ', searchValue)
>>>>>>> ebea633404d614825fdee75775ad55068a703696
  // tslint:disable-next-line: no-any
  let userSearchResponse: any = {}
  try {
    userSearchResponse = await axios({
      ...axiosRequestConfig,
      data: {
        request: {
          filters: { [searchType]: searchValue.toLowerCase() },
          query: '',
        },
      },
      headers: { Authorization: CONSTANTS.SB_API_KEY },
      method: 'POST',
      url: API_END_POINTS.searchSb,
    })
    logInfo('Search response  : ', userSearchResponse.data.result)
    return userSearchResponse
  } catch (error) {
    logInfo('error of user search' + error)
  }
<<<<<<< HEAD
};
>>>>>>> d9150d85127107ce70ac4c67cc9c5db79db05c57
=======
}
>>>>>>> ebea633404d614825fdee75775ad55068a703696
