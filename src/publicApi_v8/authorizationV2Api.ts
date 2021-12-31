import axios from "axios";
import expressSession from "express-session";
import _ from "lodash";
import qs from "querystring";
import { axiosRequestConfig } from "../configs/request.config";
import { getSessionConfig } from "../configs/session.config";
import { CONSTANTS } from "../utils/env";
import { logInfo } from "../utils/logger";
const API_END_POINTS = {
  generateToken: `https://aastrika-sb.idc.tarento.com/auth/realms/sunbird/protocol/openid-connect/token`,
  verfifyToken: `https://aastrika-sb.idc.tarento.com/auth/realms/sunbird/protocol/openid-connect/userinfo`,
};
// tslint:disable-next-line: no-any
export const authorizationV2Api = async (
  username: string,
  password: string,
  req: any
) => {
  logInfo("Entered into authorizationV2Api ");

  const encodedData = qs.stringify({
    client_id: "portal",
    client_secret: `${CONSTANTS.KEYCLOAK_CLIENT_SECRET}`,
    grant_type: "password",
    password,
    username,
  });
  logInfo("Entered into authorization part." + encodedData);

  try {
    const authTokenResponse = await axios({
      ...axiosRequestConfig,
      data: encodedData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      url: API_END_POINTS.generateToken,
    });

    logInfo("Entered into authTokenResponse :" + authTokenResponse);

    const accessToken = authTokenResponse.data.access_token;
    if (accessToken) {
      const userTokenResponse = await axios({
        ...axiosRequestConfig,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        method: "GET",

        url: API_END_POINTS.verfifyToken,
      });
      logInfo("userTokenResponse : " + userTokenResponse);
      if (userTokenResponse.data.name) {
        logInfo("Success ! Entered into usertokenResponse..");
        const sessionConfiguration = getSessionConfig();
        logInfo("Entered into set session Config.. ");
        req.app.use(expressSession(sessionConfiguration));
        logInfo("req.session " + req.session);
        if (_.isEmpty(req.session)) {
          logInfo("req.session is empty " + req.session);
        } else {
          logInfo("req.session is  not empty " + req.session);
        }
      }
    }
  } catch (e) {
    logInfo("Error throwing Cookie : " + e);
  }
  return true;
};
