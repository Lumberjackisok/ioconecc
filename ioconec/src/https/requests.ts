import axios, { AxiosError } from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import { progressStart, progressEnd } from '../utils/progress';

const instance: AxiosInstance = axios.create({
  baseURL: 'http://fuckme.com',
})

//请求拦截
instance.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  progressStart();

  let token = sessionStorage.getItem('token') == null ? '' : JSON.parse(sessionStorage.getItem('token')!);
  if (token) {
    // config.headers!["Authori-zation"] = `Bearer ${token}`;
    config.headers!["Authorization"] = `Bearer ${token}`;
  }

  return config
}, (err: AxiosError) => {
  progressEnd();

  Promise.reject(err)
})

//响应拦截
instance.interceptors.response.use((response: AxiosResponse) => {
  progressEnd();

  return response.data ? response.data : response
}, (err: AxiosError) => {
  progressEnd();

  Promise.reject(err)
})

export default instance
