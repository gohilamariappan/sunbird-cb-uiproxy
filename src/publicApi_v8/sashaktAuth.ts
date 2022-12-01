import axios from "axios";
import express from "express";
import jwt_decode from "jwt-decode";
import _ from "lodash";
import qs from "querystring";
import { axiosRequestConfig } from "../configs/request.config";
import { CONSTANTS } from "../utils/env";
import { logError, logInfo } from "../utils/logger";
import { getCurrentUserRoles } from "./rolePermission";

const AUTH_FAIL =
  "Authentication failed ! Please check credentials and try again.";
const API_END_POINTS = {
  fetchUserByEmail: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/email/`,
  fetchUserByMobileNo: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/phone/`,
  generateToken: `${CONSTANTS.HTTPS_HOST}/auth/realms/sunbird/protocol/openid-connect/token`,
  sashaktUserDetailsUrl: `https://sashakt-hwc.mohfw.gov.in/api/user-account/profile`,
};
export const sashakt = express.Router();
// tslint:disable-next-line: no-any
sashakt.post("/login", async (req: any, res) => {
  logInfo("Entered into sashakt route");
  const host = req.get("host");
  const courseId = req.query.moduleId;
  let resRedirectUrl = `https://${host}/app/toc/${courseId}/overview?primaryCategory=Course`;
  try {
    const sashaktToken = req.query.token;
    const userDetailResponseFromShashakt = await axios({
      ...axiosRequestConfig,
      headers: {
        Authorization: sashaktToken,
      },
      method: "POST",
      url: API_END_POINTS.sashaktUserDetailsUrl,
    });
    const userEmail = userDetailResponseFromShashakt.data.userDetails.email;
    logInfo("User details from shashakt", userEmail);
    if (!userDetailResponseFromShashakt.data.userDetails) {
      logInfo("User details not present in e shashakt");
    }
    const resultEmail = await fetchUserBymobileorEmail(
      userDetailResponseFromShashakt.data.email,
      "email"
    );
    logInfo("User details sunbird", resultEmail);
    if (!resultEmail) {
      logInfo("Received error from user search sunbird. ");
    }
    const encodedData = qs.stringify({
      client_id: "eShashakt",
      client_secret: `${CONSTANTS.KEYCLOAK_CLIENT_SECRET_SASHAKT}`,
      grant_type: "client_credentials",
      username: userEmail,
    });
    logInfo("Entered into authorization part." + encodedData);

    const authTokenResponse = await axios({
      ...axiosRequestConfig,
      data: encodedData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      url: API_END_POINTS.generateToken,
    });
    if (authTokenResponse.data) {
      const accessToken = authTokenResponse.data.access_token;
      // tslint:disable-next-line: no-any
      const decodedToken: any = jwt_decode(accessToken);
      const decodedTokenArray = decodedToken.sub.split(":");
      const userId = decodedTokenArray[decodedTokenArray.length - 1];
      req.session.userId = userId;
      req.kauth = {
        grant: {
          access_token: { content: decodedToken, token: accessToken },
        },
      };
      req.session.grant = {
        access_token: { content: decodedToken, token: accessToken },
      };
      logInfo("Success ! Entered into usertokenResponse..");
      await getCurrentUserRoles(req, accessToken);
    } else {
      res.status(302).json({
        msg: AUTH_FAIL,
        status: "error",
      });
    }
  } catch (err) {
    logError("Failed to process callback API.. error: " + JSON.stringify(err));
    resRedirectUrl = `https://${host}/public/home`;
  }
  res.redirect(resRedirectUrl);
});

const fetchUserBymobileorEmail = async (
  searchValue: string,
  searchType: string
) => {
  logInfo(
    "Checking Fetch Mobile no : ",
    API_END_POINTS.fetchUserByMobileNo + searchValue
  );
  try {
    const response = await axios({
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
      },
      method: "GET",
      url:
        searchType === "email"
          ? API_END_POINTS.fetchUserByEmail + searchValue
          : API_END_POINTS.fetchUserByMobileNo + searchValue,
    });
    logInfo("Response Data in JSON :", JSON.stringify(response.data));
    logInfo("Response Data in Success :", response.data.responseCode);
    if (response.data.responseCode === "OK") {
      logInfo(
        "Response result.exists :",
        _.get(response, "data.result.exists")
      );
      return _.get(response, "data.result.exists");
    }
  } catch (err) {
    logError("fetchUserByMobile  failed");
  }
};
