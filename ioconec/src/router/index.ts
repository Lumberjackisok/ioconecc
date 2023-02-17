import {
  createRouter,

  createWebHashHistory,

} from "vue-router";

import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory("/"),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Home',
        login: true
      },
      // children: [

      // ]
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/login/login.vue"),
      meta: {
        title: 'Login',

      },
    },
    {
      path: "/test",
      name: "test",
      component: () => import("../views/test/test.vue"),
    }
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  let token = sessionStorage.getItem('token');
  // let token = uerStore.token;
  if (to.meta.login && !token) {
    return "/login" + to.path;
  }
  //标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  return true;
})

export default router
