import axios from "axios";
import { assertApiTarget, getApiBaseUrl, isStagingApi } from "./apiConfig";

// Preserve the existing Axios transport outside staging. XHR cannot disable
// redirects, so staging uses Axios's fetch adapter with a locked Fetch policy.
const apiAxios = isStagingApi ? axios.create() : axios;
if (isStagingApi) {
  apiAxios.interceptors.request.use(config => {
    getApiBaseUrl();
    assertApiTarget(apiAxios.getUri(config));
    config.adapter = "fetch";
    config.fetchOptions = { ...config.fetchOptions, redirect: "error" };
    return config;
  });
}
export default apiAxios;
