<script lang="ts">
export default {
  name: 'HomeView',
}
</script>
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { login } from '../../https/index';

//引入UserStore
import { useUserStore } from '../../stores/modules/user';

import { useRouter } from "vue-router";
const router = useRouter();

//实例化userStore
const userStore = useUserStore();

const state = reactive({
  email: '',
  password: '',
})

const postLogin = async () => {
  // router.replace({
  //   path: '/test',
  // })
  try {
    const res = await login(state.email, state.password);
    // alert(JSON.stringify(res));
    // alert(state.password);
    console.log('登录信息：', res);
    if (res.status == 200) {
      //调用pinia里的函数
      userStore.setToken(res.data.token);
      userStore.setUserInfo(res.data);

      setTimeout(() => {
        router.replace({ name: 'home' });
      }, 1000);
    }
  } catch (e) {
    console.log(e);
    // alert(e);
  }
};

const onlogin = () => {
  postLogin();
};
</script>

<template>
 <div>
  <div className="hero min-h-screen bg-base-200">
  <div className="hero-content flex-col lg:flex-row-reverse">
    <div className="text-center lg:text-left">
      <h1 className="text-5xl font-bold">Login now!</h1>
      <p className="py-6">welcome to ioconec,motherfucker.</p>
    </div>
    <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
      <div className="card-body">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input v-model="state.email" type="text" placeholder="email" className="input input-bordered"/>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input v-model="state.password" type="password" placeholder="password" className="input input-bordered" />
          <label className="label">
            <a href="#" className="label-text-alt link link-hover">Forgot password?</a>
          </label>
        </div>
        <div className="form-control mt-6">
          <button className="btn btn-primary" @click="postLogin">Login</button>
        </div>
      </div>
    </div>
  </div>
</div>
 </div>
</template>

<style scoped>

</style>