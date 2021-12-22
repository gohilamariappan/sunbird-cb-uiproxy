import axios from 'axios'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'

const API_END_POINTS = {
  searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
}

try {

export const fetchUser = async (searchValue: string, searchType: string) => {
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

