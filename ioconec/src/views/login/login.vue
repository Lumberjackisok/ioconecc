<script lang="ts">
export default {
  name: 'HomeView',
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { login, register } from '../../https/index';
import { progressStart, progressEnd } from '../../utils/progress';
import { languagesList } from '../../config/index';


//引入UserStore
import { useUserStore } from '../../stores/modules/user';

//路由器
import { useRouter } from "vue-router";
const router = useRouter();

//实例化userStore
const userStore = useUserStore();

const state: any = reactive({
  email: '',
  username: '',
  password: '',
  language: 'Pick your native language',
  errorMsg: '',
  isLoginNow: true,
  isSigned: false
})

const postLogin = async () => {
  try {
    const res: any = await login(state.email, state.password);
    // alert(JSON.stringify(res));
    // alert(state.password);
    console.log('登录信息：', res);
    if (res.status == 200) {
      state.errorMsg = '';

      //调用pinia里的函数
      userStore.setToken(res.data.token);
      userStore.setUserInfo(res.data);

      setTimeout(() => {
        router.replace({ name: 'home' });
      }, 1000);
      state.password = '';
    } else {
      state.errorMsg = res.message;
    }
  } catch (e) {
    console.log(e);
    // alert(e);
  }
};

//点击显示注册卡片
const toRegiser = () => {
  state.isLoginNow = false;
}

//点击注册
const postRegister = async () => {
  try {
    let datas: any = await register(state.email, state.username, state.password, state.language);
    if (datas.status == 200) {
      state.errorMsg = '';
      state.password = '';
      state.language = '';

      progressStart();
      setTimeout(() => {
        state.isSigned = true;
      }, 1000);
      progressEnd();

    } else {
      state.errorMsg = datas.message;
    }
  } catch (err) {
    console.log(err);
  }
}

//click get start
const onGetStart = () => {
  progressStart();
  setTimeout(() => {
    state.isLoginNow = true;
    state.isSigned = false;
  }, 1200);
  progressEnd();
}

onMounted(() => {

});
</script>

<template>
 <div>
  
<div v-if="state.isSigned" class="relative">
    <!-- <div class="inset-0 z-10 w-full h-screen overflow-y-auto">
        <div class="absolute inset-0 w-full h-full bg-gray-500 opacity-75">
        </div>
        <div class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            </span>
            <div class="relative inline-block overflow-hidden transition-all transform sm:align-middle sm:max-w-lg" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div>
                    <div class="rounded-lg p-8 bg-white shadow">
                        <div class="bg-white dark:bg-gray-800 ">
                            <div class="text-center w-full mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 z-20">
                                <h2 class="text-3xl font-extrabold text-black dark:text-white sm:text-4xl">
                                    <span class="block">
                                  Oh hi mark
                                    </span>
                                    
                                </h2>
                                <div class="lg:mt-0 lg:flex-shrink-0">
                                    <div class="mt-12 inline-flex rounded-md shadow">
                                        <button @click="onGetStart" type="button" class="py-4 px-6  bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                                          I did not hit her
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div> -->

    <div className="hero min-h-screen bg-base-200">
  <div className="hero-content text-center">
    <div className="max-w-md">
      <h1 className="text-5xl font-bold">Oh hi mark</h1>
      <p className="py-6">I did not hit her</p>
      <button @click="onGetStart" className="btn btn-primary">I did not</button>
    </div>
  </div>
</div>
</div>

<!-- 错误提示 -->
<div v-if="state.errorMsg != ''" class="relative flex items-center px-4 py-3 text-sm font-bold text-white bg-blue-500" role="alert">
    <svg width="20" height="20" fill="currentColor" class="w-4 h-4 mr-2" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
        <path d="M1216 1344v128q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h64v-384h-64q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h384q26 0 45 19t19 45v576h64q26 0 45 19t19 45zm-128-1152v192q0 26-19 45t-45 19h-256q-26 0-45-19t-19-45v-192q0-26 19-45t45-19h256q26 0 45 19t19 45z">
        </path>
    </svg>
    <p>
        {{ state.errorMsg }}
    </p>
    <button @click="state.errorMsg = ''" class="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="w-6 h-6 text-white" viewBox="0 0 1792 1792">
            <path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z">
            </path>
        </svg>
    </button>
</div>
<!-- 错误提示 -->

  <div v-if="state.isSigned == false" className="hero min-h-screen bg-base-200">
  <div className="hero-content flex-col lg:flex-row-reverse">
    <div className="text-center lg:text-left">
      <h1 className="text-5xl font-bold">{{ state.isLoginNow ? 'Login now!' : 'Sign up now!' }}</h1>
      <p className="py-6">welcome to ioconec,madafruka.</p>
    </div>
    <!-- login card |登录卡片 -->
    <div v-if="state.isLoginNow == true" className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
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
          <button className="btn btn-primary"  @click="postLogin">Login</button>
        </div>
        <div class="flex items-center justify-center mt-6">
                <a @click.prevent="toRegiser" target="_blank" class="inline-flex items-center text-xs font-thin text-center text-gray-500 hover:text-gray-700 dark:text-gray-100 dark:hover:text-white cursor-pointer">
                    <span class="ml-2">
                        You don&#x27;t have an account?
                    </span>
                </a>
            </div>
      </div>
    </div>
    <!-- login card |登录卡片 -->

    <!-- register card |注册卡片 -->
    <div v-else className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
      <div className="card-body">
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input v-model="state.email" type="text" placeholder="email" className="input input-bordered"/>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Username</span>
          </label>
          <input v-model="state.username" type="text" placeholder="username" className="input input-bordered"/>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input v-model="state.password" type="password" placeholder="password" className="input input-bordered" />
          <!-- <label className="label">
            <a href="#" className="label-text-alt link link-hover">Forgot password?</a>
          </label> -->
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Language</span>
          </label>
          <select v-model="state.language" className="select select-bordered  w-full max-w-xs">
            <option v-for="item in languagesList" :key="item.language" :disabled="item.disabled" :value="item.language">{{ item.language }}</option>
          </select>
        </div>
    
        <div className="form-control mt-6">
          <button className="btn btn-primary" @click="postRegister">Sign up</button>
        </div>
        <div class="flex items-center justify-center mt-6">
                <a @click.prevent="state.isLoginNow = true" target="_blank" class="inline-flex items-center text-xs font-thin text-center text-gray-500 hover:text-gray-700 dark:text-gray-100 dark:hover:text-white cursor-pointer">
                    <span class="ml-2">
                      Already have an account ?
                    </span>
                </a>
            </div>
        
      </div>
    </div>
    <!-- register card |注册卡片 -->

  </div>
  </div>
</div>
</template>

<style scoped></style>