import axios from 'axios'
import _ from 'lodash'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logInfo } from '../utils/logger'

const API_END_POINTS = {
  searchSb: `${CONSTANTS.LEARNER_SERVICE_API_BASE}/private/user/v1/search`,
}

  export const userSearch = async (searchValue: string, searchType: string) => {
    logInfo('Search User endpoint proxy 11 : ', API_END_POINTS.searchSb)
  

      logInfo('Search User - Entered in phone and value is : ', searchValue)
        const userSearchResponse = await axios({
            ...axiosRequestConfig,
            data: {
              request: { query: '', filters: { searchType : searchValue.toLowerCase() } },
            },
            method: 'POST',
            url: API_END_POINTS.searchSb,
          })
        logInfo('genreate otp response' + userSearchResponse)
        return userSearchResponse
  
  }