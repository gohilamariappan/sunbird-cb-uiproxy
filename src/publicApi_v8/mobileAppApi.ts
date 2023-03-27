import { Router } from "express";
import jwt_decode from "jwt-decode";
import request from "request";
import { assessmentCreator } from "../utils/assessmentSubmitHelper";
import { CONSTANTS } from "../utils/env";
import { logInfo } from "../utils/logger";

export const mobileAppApi = Router();

mobileAppApi.get("/getContents/*", (req, res) => {
  try {
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      res.status(404).json({
        message: "User token missing",
      });
      return;
    }
    let userId = "";
    try {
      // tslint:disable-next-line: no-any
      const decodedToken: any = jwt_decode(accessToken.toString());
      const decodedTokenArray = decodedToken.sub.split(":");
      userId = decodedTokenArray[decodedTokenArray.length - 1];
    } catch (error) {
      res.status(404).json({
        message: "Invalid user token",
      });
      return;
    }
    logInfo("UserId for new APP api getContents", userId);
    const path = removePrefix(
      "/public/v8/mobileApp/getContents/",
      req.originalUrl
    );
    const sunbirdUrl = CONSTANTS.S3_BUCKET_URL + path;
    logInfo(
      "New getcontents sunbird URL for Mobile APP >>>>>>>>>>> ",
      sunbirdUrl
    );
    return request(sunbirdUrl).pipe(res);
  } catch (err) {
    res.status(404).json({
      message: "Content not found",
    });
  }
});

mobileAppApi.post("/submitAssessment", async (req, res) => {
  try {
    const assessmentData = req.body;
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      res.status(404).json({
        message: "User token missing",
      });
      return;
    }
    let userId = "";
    try {
      // tslint:disable-next-line: no-any
      const decodedToken: any = jwt_decode(accessToken.toString());
      const decodedTokenArray = decodedToken.sub.split(":");
      userId = decodedTokenArray[decodedTokenArray.length - 1];
    } catch (error) {
      res.status(404).json({
        message: "Invalid user token",
      });
      return;
    }
    const assessmentSubmitStatus = await assessmentCreator(
      assessmentData,
      accessToken,
      userId
    );
    res.status(assessmentSubmitStatus.status).json({
      data: assessmentSubmitStatus.data,
      message: assessmentSubmitStatus.message,
    });
  } catch (err) {
    res.status(404).json({
      message: "Error occured while submit",
    });
  }
});
function removePrefix(prefix: string, s: string) {
  return s.substr(prefix.length);
}
