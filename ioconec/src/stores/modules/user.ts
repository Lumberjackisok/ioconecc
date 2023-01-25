import { defineStore } from 'pinia'


interface _user {
  avatar: string,
  createTime: number,
  email: string,
  token: string,
  username: string,
  _id: string,
}

export const useUserStore = defineStore('userInfo', {
  state: () => {
    return {
      userInfo: {},
      token: ""
    }
  },
  // 相当于 vue 中的 computed 计算属性
  getters: {},

  // 相当于 vue 中的 methods 方法
  actions: {
    setUserInfo(userInfo: _user) {
      this.userInfo = userInfo;//this就是state
    },
    setToken(token: string) {
      this.token = token;
    }
  },
  /**
   * 持久化储存
   * 默认存储到 sessionStorage ，key 为 store 的 id
   * 
  */
  persist: {
    enabled: true,
    strategies: [
      {
        //指定储存方式、变量、key
        storage: sessionStorage,
        paths: ['token'],
        key: 'token'
      },
      {
        storage: sessionStorage,
        paths: ['userInfo'],
        key: 'userInfo'
      }
    ]
  }
});
