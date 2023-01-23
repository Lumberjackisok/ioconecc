import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Home',
        login: true
      },
      children: [

      ]
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/login/login.vue"),
      meta: {
       title: 'Login',
      },
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

router.beforeEach((to, from) => {
  let token = window.sessionStorage.getItem('token');
  if (to.meta.login && !token) {
    return "/login?url=" + to.path;
  }
  //标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  return true;
})

export default router
