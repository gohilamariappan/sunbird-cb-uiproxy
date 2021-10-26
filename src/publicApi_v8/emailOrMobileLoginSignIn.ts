import axios from "axios";
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import _ from "lodash";
import { axiosRequestConfig } from "../configs/request.config";
import { CONSTANTS } from "../utils/env";
import { logError, logInfo } from "../utils/logger";
const API_END_POINTS = {
  createUserWithMobileNo: `${CONSTANTS.KONG_API_BASE}/user/v1/signup`,
  fetchUserByMobileNo: `${CONSTANTS.KONG_API_BASE}/user/v1/exists/phone/`,
};

export const emailOrMobileLogin = Router();

emailOrMobileLogin.post("/signup", async (req, res) => {
  try {
    // tslint:disable-next-line: no-any
    if (!req.body.email || req.body.phone === undefined) {
      res.status(400).json({
        status: "error",
        status_code: 400,
        msg: "Mobile No or Email id can not be empty",
      });
    }
    const { phone, firstName, email } = req.body;
    let profile: any = {};
    let isUserExist = {};
    let newUserDetails = {};
    isUserExist = await fetchUserByMobile(phone);
    if (!isUserExist) {
      logInfo("creating new  user");
      profile = {
        phone: phone,
        firstName: firstName,
        email: email,
      };
      newUserDetails = await createuserWithmobileOrEmail(profile).catch(
        handleCreateUserError
      );
      if (newUserDetails) {
        res.status(200).json({
          status: "success",
          status_code: 200,
          msg: "user created successfully",
        });
      } else {
        logInfo("Mobile already exists.");
        res.status(400).json({
          status: "error",
          status_code: 400,
          msg: "Mobile Number already exists.",
        });
        return;
      }
    }
  } catch (error) {}
});
// tslint:disable-next-line: no-any
const handleCreateUserError = (error: any) => {
  logInfo("Error ocurred while creating user" + error);
  if (_.get(error, "error.params")) {
    throw error.error.params;
  } else if (error instanceof Error) {
    throw error.message;
  } else {
    throw new Error("unhandled exception while getting userDetails");
  }
};
const emailOrMobile = (value: string) => {
  const isValidEmail = emailValidator(value);
  if (isValidEmail) {
    return "email";
  } else {
    const isValidMobile = mobileValidator(value);
    if (isValidMobile) {
      return "phone";
    }
  }
  return "error";
};

const emailValidator = (value: string) => {
  // tslint:disable-next-line: max-line-length
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    value
  );
};
const mobileValidator = (value: string) => {
  return /^([7-9][0-9]{9})$/.test(value);
};
const fetchUserByMobile = async (phone: string) => {
  logInfo(
    "Checking Fetch Mobile no : ",
    API_END_POINTS.fetchUserByMobileNo + phone
  );
  try {
    const response = await axios({
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
      },
      method: "GET",
      url: API_END_POINTS.fetchUserByMobileNo + phone,
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

// tslint:disable-next-line: no-any
const createuserWithmobileOrEmail = async (accountDetails: any) => {
  if (!accountDetails.name || accountDetails.name === "") {
    throw new Error("USER_NAME_NOT_PRESENT");
  }
  try {
    const response = await axios({
      ...axiosRequestConfig,
      data: {
        request: {
          phone: accountDetails.phone,
          firstName: accountDetails.firstName,
        },
      },
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
      },
      method: "POST",
      url: API_END_POINTS.createUserWithMobileNo,
    });
    if (response.data.responseCode === "OK") {
      logInfo("Log of createuser if OK :");
      return response.data;
    } else {
      throw new Error(
        _.get(response.data, "params.errmsg") ||
          _.get(response.data, "params.err")
      );
    }
  } catch (err) {
    logError("createuserwithmobile failed");
  }
};
