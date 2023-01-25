import axios, { AxiosError } from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const instance: AxiosInstance = axios.create({
  baseURL: 'http:/fuck me'
})

//请求拦截
instance.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  // NProgress.start()


  let token = sessionStorage.getItem('token');
  if (token) {
    config.headers!["Authori-zation"] = `Bearer ${token}`;
  }

  return config
}, (err: AxiosError) => {
  // NProgress.done()

  Promise.reject(err)
})

//响应拦截
instance.interceptors.response.use((response: AxiosResponse) => {
  // NProgress.done()

  return response.data ? response.data : response
}, (err: AxiosError) => {
  // NProgress.done()

  Promise.reject(err)
})

export default instance
