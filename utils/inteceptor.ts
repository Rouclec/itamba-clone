import axios, { AxiosError, type AxiosInstance } from "axios";
import Cookies from "js-cookie";
import { setCookie } from "./functions/set_cookie";
import { client as annotationClient } from "@/@hey_api/annotation.swagger";
import { client as documentsmaterialsClient } from "@/@hey_api/documentsmaterials.swagger";
// import { client as encyclopediaClient } from "@/../@hey_api/encyclopedia.swagger";
// import { client as logsClient } from "@/../@hey_api/logs.swagger";
import { client as subscriptionClient } from "@/@hey_api/subscription.swagger";
import { client as paymentsClient } from "@/@hey_api/payments.swagger";
import { client as userClient } from "@/@hey_api/users.swagger";


import {
  ensureValidAccessToken,
  ensureValidAccessTokenForcedRefresh,
  clearSession,
} from "@/utils/auth/session";

let tokenString;
let token = "";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (typeof window !== "undefined") {
  tokenString = Cookies.get("token");
  if (tokenString) token = tokenString;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const axiosMultipart: AxiosInstance = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
});

annotationClient.setConfig({
  baseURL,
});

documentsmaterialsClient.setConfig({
  baseURL,
});

// encyclopediaClient.setConfig({
//   baseURL,
// });

// logsClient.setConfig({
//   baseURL,
// });

subscriptionClient.setConfig({
  baseURL,
});
paymentsClient.setConfig({
  baseURL,
});

userClient.setConfig({
  baseURL,
});

const applyAuthorizationHeaders = (newToken: string) => {
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
  axiosInstance.defaults.headers.Authorization = `Bearer ${newToken}`;

  axiosMultipart.defaults.headers.common.Authorization = `Bearer ${newToken}`;
  axiosMultipart.defaults.headers.Authorization = `Bearer ${newToken}`;

  annotationClient.setConfig({
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  documentsmaterialsClient.setConfig({
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  subscriptionClient.setConfig({
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });
  paymentsClient.setConfig({
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  userClient.setConfig({
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });
};

/**
 * Updates the default authorization headers for both regular and multipart Axios instances.
 *
 * This function sets the `Authorization` header to include a new token for future API requests.
 * It also updates the token stored in cookies to maintain user authentication.
 *
 * @param {string} newToken - The new authorization token to be used in API requests.
 */

export const setAuthorizationHeaders = (newToken: string) => {
  applyAuthorizationHeaders(newToken);
  setCookie("token", newToken, 10 * 24 * 60 * 60 * 1000);
};

// Make sure hey-api clients have auth headers on a hard refresh (when token is already in cookies)
if (token) {
  applyAuthorizationHeaders(token);
}

type RetriableAxiosConfig = AxiosError["config"] & { _retry?: boolean };

const attachRefreshOn401 = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error?.response?.status;
      const originalRequest = error.config as RetriableAxiosConfig | undefined;

      if (!originalRequest || status !== 401) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        clearSession();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Try a forced refresh first (handles revoked access tokens even if not expired)
      const newToken =
        (await ensureValidAccessTokenForcedRefresh()) ??
        (await ensureValidAccessToken());

      if (!newToken) {
        clearSession();
        return Promise.reject(error);
      }

      // Update global headers + cookies, and retry the failed request
      setAuthorizationHeaders(newToken);
      originalRequest.headers = {
        ...(originalRequest.headers ?? {}),
        Authorization: `Bearer ${newToken}`,
      } as any;

      return instance(originalRequest as any);
    },
  );
};

attachRefreshOn401(documentsmaterialsClient.instance);

// encyclopediaClient.instance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // refresh the access token when there's a 403 or 401 returned from the backend.
//     if (error?.response?.status === 401) {
//       handleTokenRefresh();
//     }
//     return Promise.reject(error);
//   },
// );

attachRefreshOn401(annotationClient.instance);

// logsClient.instance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // refresh the access token when there's a 403 or 401 returned from the backend.
//     if (error?.response?.status === 401) {
//       handleTokenRefresh();
//     }
//     return Promise.reject(error);
//   },
// );

attachRefreshOn401(subscriptionClient.instance);
attachRefreshOn401(paymentsClient.instance);

attachRefreshOn401(userClient.instance);

attachRefreshOn401(axiosMultipart);

attachRefreshOn401(axiosInstance);

export default axiosInstance;
