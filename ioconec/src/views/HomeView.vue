<script lang="ts">
export default {
    name: 'HomeView',
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue';
import { search, getHistory, notifyList, createGroup } from '../https/index';
import { useUserStore } from '@/stores/modules/user';
import { baseURL } from '../privateKeys/index';
import io from 'socket.io-client';
import { notifyFormatter } from '../utils/time'

//实例化userStore
const userStore: any = useUserStore();


//连接服务器socket.io，并把token传给服务器，以便服务器更新用户信息（isLogin、socketId）
const token = window.sessionStorage.getItem('token') == null ? '' : window.sessionStorage.getItem('token')!;
const socket = io(baseURL, {
    autoConnect: false,
    extraHeaders: {
        "Access-Control-Allow-Origin": '*'
    },
    query: {
        token: token
    }
});
socket.connect();
//连接socket.io

//监听
socket.on('connect', () => {
    console.log('连接成功');
});

socket.on('disconnect', () => {
    console.log('连接断开');
});

socket.on('message', async (data: any) => {
    console.log('服务器监听到message,转发过来的数据', data);
    if (data.message === 'go get update') {
        getNotifyList();//获取最新的信息预览通知
        // getHistory(id);
    }
});


console.log('in home page,userInfo:', userStore.userInfo);

const state: any = reactive({
    searchContent: '',
    searchList: [],
    notifyList: [],
});



//聊天窗口数据
const roomView: any = reactive({
    receiverInfo: null,
    content_type: 1,
    content: '',
    groupId: "",
});


//聊天数据
const message: any = reactive({
    list: []
});

//点击搜索
const onSearch = async () => {
    try {
        let datas: any = await search(state.searchContent);
        console.log('搜索：', datas);
        if (datas.status == 200) {
            state.searchList = datas.users;
        }
    } catch (e) {
        console.log(e);
    }
};
//点击搜索

//点击搜索列表或聊天列表后，开启单聊聊天室
const goChat = async (receiverInfo: any, isNewChat: number) => {
    roomView.receiverInfo = receiverInfo;
    console.log('点击后对应的用户信息:', receiverInfo._id);

    if (isNewChat === 1) {
        try {
            const name = userStore.userInfo._id + " " + receiverInfo._id;
            const datas2: any = await createGroup(name, 1);
            if (datas2.status === 200) {
                console.log('创建聊天室：', datas2);
                roomView.groupId = datas2.group._id;
            }

            const datas: any = await getHistory(receiverInfo._id);
            if (datas.status === 200) {
                message.list = datas.datas.message;
                console.log('聊天历史记录:', datas);
            }
        } catch (err) {
            console.log(err);
        }
    } else {
        //处理非新创建聊天室的情况
        console.log(roomView.receiverInfo);


        /**
         * 1从服务器获取对应的聊天记录
         * （服务器收到请求后将数据库里对应的message的状态更新为已读(isRead:1)）
         * 
        */
        roomView.groupId = roomView.receiverInfo.notify.group;//对应的groupId更新过去
        myGetHistory(roomView.receiverInfo._id);//去掉未读圆点
        getNotifyList();
    }


};
//点击搜索列表或聊天列表后，开启聊天室

//点击发送消息
const onSend = async () => {
    console.log(roomView.receiverInfo.language);
    if (roomView.content != '') {
        const sendData = {
            // isGroup: 0,//是否群组，默认否,如果是单聊就服务端处理翻译
            sender: userStore.userInfo._id,//自己的id
            receiver: roomView.receiverInfo._id,//要发送信息给那个人的id
            contentType: 1,//1:文本，2：图片,暂时默认写死1，后期再根据实际做判断
            content: roomView.content,//发送的信息内容
            receiverLanguage: roomView.receiverInfo.language,//对方的母语
            isRead: 0,//0：未读，1：已读,默认未读
            groupId: roomView.groupId,
        };

        //发送消息给服务端
        socket.emit('message', { sendData }, (data: any) => {
            //发送成功的回调，可以写查找历史记录的业务，比如message.list = data;
            // message.list = data;
            console.log('发送成功后服务器返回来的:', data);
        });
    };

};
//点击发送消息


//获取聊天历史
const myGetHistory = async (receiver: any) => {
    try {
        let datas: any = await getHistory(receiver);
        if (datas.status === 200) {
            message.list = datas.datas.message;
            console.log('聊天历史记录10086：', datas);

        }
    } catch (err) {
        console.log(err);
    }
};



//获取消息预览列表
const getNotifyList = async () => {
    try {
        let datas: any = await notifyList();
        if (datas.status == 200) {
            console.log('notify list:', datas);
            state.notifyList = datas;
        }


    } catch (err) {
        console.log(err);
    }
};

onMounted(() => {
    let token = sessionStorage.getItem('token') == null ? '' : JSON.parse(sessionStorage.getItem('token')!);
    console.log('token::::', token.token);
    getNotifyList();
});

</script>

<template>
 <div class="h-screen w-full flex antialiased text-gray-200 bg-gray-900 overflow-hidden">
    <div class="flex-1 flex flex-col">
    
        <main class="flex-grow flex flex-row min-h-0">
            
            <section class="flex flex-col flex-none overflow-auto w-24 hover:w-64 group lg:max-w-sm md:w-2/5 transition-all duration-300 ease-in-out">
                <div class="header p-4 flex flex-row justify-between items-center flex-none">
                    <div class="w-16 h-16 relative flex flex-shrink-0" style="filter: invert(100%);">
                        <img class="rounded-full w-full h-full object-cover" alt="ravisankarchinnam"
                             src="../assets/fire.ico"/>
                    </div>
                    <p class="text-md font-bold hidden md:block group-hover:block">IOconec</p>
                    <a href="#" class="block rounded-full hover:bg-gray-700 bg-gray-800 w-10 h-10 p-2 hidden md:block group-hover:block">
                        <svg viewBox="0 0 24 24" class="w-full h-full fill-current">
                            <path
                                    d="M6.3 12.3l10-10a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-.7.3H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 .3-.7zM8 16h2.59l9-9L17 4.41l-9 9V16zm10-2a1 1 0 0 1 2 0v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h6a1 1 0 0 1 0 2H4v14h14v-6z"/>
                        </svg>
                    </a>
                </div>

                <!-- 搜索框 -->
                <div class="search-box p-4 flex-none">
                    <form onsubmit="">
                        <div class="relative">
                            <label>
                                <input v-model="state.searchContent" @keyup="onSearch" class="rounded-full py-2 pr-6 pl-10 w-full border border-gray-800 focus:border-gray-700 bg-gray-800 focus:bg-gray-900 focus:outline-none text-gray-200 focus:shadow-md transition duration-300 ease-in"
                                       type="text"  placeholder="Search Messenger"/>
                                <span  class="absolute top-0 left-0 mt-2 ml-3 inline-block">
                                    <svg viewBox="0 0 24 24" class="w-6 h-6">
                                        <path fill="#bbb"
                                              d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
                                    </svg>
                                </span>
                            </label>
                        </div>
                    </form>
                </div>
                <!-- 搜索框 -->

                  <!-- 消息预览列表 -->
                <div v-if="state.searchContent == ''" class="contacts p-2 flex-1 overflow-y-scroll">
                  
                    <div v-for="item, index in state.notifyList.frends" :key="index" @click="goChat(item, 0)" class="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg relative">
                         <!-- 头像 -->
                        <div class="w-16 h-16 relative flex flex-shrink-0">
                            <img class="shadow-md rounded-full w-full h-full object-cover"
                                 :src="item.avatar"
                                 alt=""
                            />
                        </div>
                   <!-- 头像 -->
                

                <!-- 用户名、最新收到的信息、时间 -->
                        <div class="flex-auto min-w-0 ml-4 mr-6 hidden md:block group-hover:block">
                            <p>{{ item.username }}</p>
                            <div class="flex items-center text-sm text-gray-600">
                                <div class="min-w-0">
                                    <p class="truncate">{{ item.notify.content }}</p>
                                </div>
                                <p class="ml-2 whitespace-no-wrap">{{ notifyFormatter(item.notify.updateAt) }}</p>
                            </div>
                        </div>
                        <div v-if="userStore.userInfo._id != item.notify.sender && item.notify.isRead == 0" class="bg-blue-700 w-3 h-3 rounded-full flex flex-shrink-0 hidden md:block group-hover:block"></div>
                    </div>
                <!-- 用户名、最新收到的信息、时间 -->
                    
                </div>
                  <!-- 消息预览列表 -->


                  <!-- 搜索用户列表 -->
                <div v-if="state.searchContent != ''" class="contacts p-2 flex-1 overflow-y-scroll">
                    <div v-for="item in state.searchList" :key="item" @click="goChat(item, 1)" class="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg relative">
                        <div class="w-16 h-16 relative flex flex-shrink-0">
                            <img class="shadow-md rounded-full w-full h-full object-cover"
                                 :src="item.avatar"
                                 alt=""
                            />
                        </div>
                        <div class="flex-auto min-w-0 ml-4 mr-6 hidden md:block group-hover:block">
                            <p>{{ item.username }}</p>
                            <div class="flex items-center text-sm text-gray-600">
                                <div class="min-w-0">
                                    <p class="truncate">Last login:</p>
                                </div>
                                <p class="ml-2 whitespace-no-wrap">{{ item.lastLogin }}</p>
                            </div>
                        </div>
                    </div>
                  
                </div>
                  <!-- 搜索用户列表 -->
                  
            </section>

            <!-- 聊天室视图 -->
            <section v-if="roomView.receiverInfo" class="flex flex-col flex-auto border-l border-gray-800">
                
                <div class="chat-header px-6 py-4 flex flex-row flex-none justify-between items-center shadow">
                    <div class="flex">
                        <div class="w-12 h-12 mr-4 relative flex flex-shrink-0">
                            <img class="shadow-md rounded-full w-full h-full object-cover"
                                 :src="roomView.receiverInfo.avatar"
                                 alt=""
                            />
                        </div>
                        <div class="text-sm">
                            <p class="font-bold">{{ roomView.receiverInfo.username }}</p>
                            <p>some text...</p>
                        </div>
                    </div>

                    <div class="flex">
                        <a href="#" class="block rounded-full hover:bg-gray-700 bg-gray-800 w-10 h-10 p-2">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current text-blue-500">
                                <path d="M11.1735916,16.8264084 C7.57463481,15.3079672 4.69203285,12.4253652 3.17359164,8.82640836 L5.29408795,6.70591205 C5.68612671,6.31387329 6,5.55641359 6,5.00922203 L6,0.990777969 C6,0.45097518 5.55237094,3.33066907e-16 5.00019251,3.33066907e-16 L1.65110039,3.33066907e-16 L1.00214643,8.96910337e-16 C0.448676237,1.13735153e-15 -1.05725384e-09,0.445916468 -7.33736e-10,1.00108627 C-7.33736e-10,1.00108627 -3.44283713e-14,1.97634814 -3.44283713e-14,3 C-3.44283713e-14,12.3888407 7.61115925,20 17,20 C18.0236519,20 18.9989137,20 18.9989137,20 C19.5517984,20 20,19.5565264 20,18.9978536 L20,18.3488996 L20,14.9998075 C20,14.4476291 19.5490248,14 19.009222,14 L14.990778,14 C14.4435864,14 13.6861267,14.3138733 13.2940879,14.7059121 L11.1735916,16.8264084 Z"/>
                            </svg>
                        </a>
                        <a href="#" class="block rounded-full hover:bg-gray-700 bg-gray-800 w-10 h-10 p-2 ml-4">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current text-blue-500">
                                <path d="M0,3.99406028 C0,2.8927712 0.894513756,2 1.99406028,2 L14.0059397,2 C15.1072288,2 16,2.89451376 16,3.99406028 L16,16.0059397 C16,17.1072288 15.1054862,18 14.0059397,18 L1.99406028,18 C0.892771196,18 0,17.1054862 0,16.0059397 L0,3.99406028 Z M8,14 C10.209139,14 12,12.209139 12,10 C12,7.790861 10.209139,6 8,6 C5.790861,6 4,7.790861 4,10 C4,12.209139 5.790861,14 8,14 Z M8,12 C9.1045695,12 10,11.1045695 10,10 C10,8.8954305 9.1045695,8 8,8 C6.8954305,8 6,8.8954305 6,10 C6,11.1045695 6.8954305,12 8,12 Z M16,7 L20,3 L20,17 L16,13 L16,7 Z"/>
                            </svg>
                        </a>
                        <a href="#" class="block rounded-full hover:bg-gray-700 bg-gray-800 w-10 h-10 p-2 ml-4">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current text-blue-500">
                                <path d="M2.92893219,17.0710678 C6.83417511,20.9763107 13.1658249,20.9763107 17.0710678,17.0710678 C20.9763107,13.1658249 20.9763107,6.83417511 17.0710678,2.92893219 C13.1658249,-0.976310729 6.83417511,-0.976310729 2.92893219,2.92893219 C-0.976310729,6.83417511 -0.976310729,13.1658249 2.92893219,17.0710678 Z M9,11 L9,10.5 L9,9 L11,9 L11,15 L9,15 L9,11 Z M9,5 L11,5 L11,7 L9,7 L9,5 Z"/>
                            </svg>

                        </a>
                    </div>

                </div>

                <!-- 对话流 -->
                <div class="chat-body p-4 flex-1 overflow-y-scroll">

                    <!-- 发送者sender -->
                    <div class="flex flex-row justify-start">

                        <!-- 头像 -->
                        <div class="w-8 h-8 relative flex flex-shrink-0 mr-4">
                            <img class="shadow-md rounded-full w-full h-full object-cover"
                                 :src="roomView.receiverInfo.avatar"
                                 alt=""
                            />
                        </div>
                        <!-- 头像 -->

                       <!-- 信息内容 -->
                        <div class="messages text-sm text-gray-700 grid grid-flow-row gap-2">

                            
                            <!-- 文本信息 -->
                            <div class="flex items-center group">
                                <p class="px-6 py-3 rounded-t-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200">Hey! How are you?</p>
                                <!-- <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M10.001,7.8C8.786,7.8,7.8,8.785,7.8,10s0.986,2.2,2.201,2.2S12.2,11.215,12.2,10S11.216,7.8,10.001,7.8z
 M3.001,7.8C1.786,7.8,0.8,8.785,0.8,10s0.986,2.2,2.201,2.2S5.2,11.214,5.2,10S4.216,7.8,3.001,7.8z M17.001,7.8
C15.786,7.8,14.8,8.785,14.8,10s0.986,2.2,2.201,2.2S19.2,11.215,19.2,10S18.216,7.8,17.001,7.8z"/>
                                    </svg>
                                </button> -->

                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>

                                <!-- <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 24 24" class="w-full h-full fill-current">
                                        <path
                                                d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-3.54-4.46a1 1 0 0 1 1.42-1.42 3 3 0 0 0 4.24 0 1 1 0 0 1 1.42 1.42 5 5 0 0 1-7.08 0zM9 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                                    </svg>
                                </button> -->
                            </div>

                            <!-- 图片信息 -->
                            <div calss="flex items-center group">
                                <div class="flex items-center">
                                <a class="block w-64 h-64 relative flex flex-shrink-0 max-w-xs lg:max-w-md" href="#">
                                    <img class="absolute shadow-md w-full h-full rounded-l-lg object-cover" :src="roomView.receiverInfo.avatar" alt="hiking"/>
                                </a>
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M10.001,7.8C8.786,7.8,7.8,8.785,7.8,10s0.986,2.2,2.201,2.2S12.2,11.215,12.2,10S11.216,7.8,10.001,7.8z
	 M3.001,7.8C1.786,7.8,0.8,8.785,0.8,10s0.986,2.2,2.201,2.2S5.2,11.214,5.2,10S4.216,7.8,3.001,7.8z M17.001,7.8
	C15.786,7.8,14.8,8.785,14.8,10s0.986,2.2,2.201,2.2S19.2,11.215,19.2,10S18.216,7.8,17.001,7.8z"/>
                                    </svg>
                                </button>
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 24 24" class="w-full h-full fill-current">
                                        <path
                                                d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-3.54-4.46a1 1 0 0 1 1.42-1.42 3 3 0 0 0 4.24 0 1 1 0 0 1 1.42 1.42 5 5 0 0 1-7.08 0zM9 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                                    </svg>
                                </button>
                            </div>
                            </div>
                            <!-- 图片信息 -->

                            <div class="flex items-center group">
                                <p class="px-6 py-3 rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200">Shall we go for Hiking this weekend?</p>
                                <!-- <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M10.001,7.8C8.786,7.8,7.8,8.785,7.8,10s0.986,2.2,2.201,2.2S12.2,11.215,12.2,10S11.216,7.8,10.001,7.8z
 M3.001,7.8C1.786,7.8,0.8,8.785,0.8,10s0.986,2.2,2.201,2.2S5.2,11.214,5.2,10S4.216,7.8,3.001,7.8z M17.001,7.8
C15.786,7.8,14.8,8.785,14.8,10s0.986,2.2,2.201,2.2S19.2,11.215,19.2,10S18.216,7.8,17.001,7.8z"/>
                                    </svg>
                                </button> -->
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
                                <!-- <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 24 24" class="w-full h-full fill-current">
                                        <path
                                                d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-3.54-4.46a1 1 0 0 1 1.42-1.42 3 3 0 0 0 4.24 0 1 1 0 0 1 1.42 1.42 5 5 0 0 1-7.08 0zM9 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                                    </svg>
                                </button> -->
                            </div>
                            <div class="flex items-center group">
                                <p class="px-6 py-3 rounded-b-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200">Lorem ipsum
                                    dolor sit
                                    amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                                    dolore magna aliqua. Volutpat lacus laoreet non curabitur gravida.</p>
                                
                                    <!-- <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M10.001,7.8C8.786,7.8,7.8,8.785,7.8,10s0.986,2.2,2.201,2.2S12.2,11.215,12.2,10S11.216,7.8,10.001,7.8z
 M3.001,7.8C1.786,7.8,0.8,8.785,0.8,10s0.986,2.2,2.201,2.2S5.2,11.214,5.2,10S4.216,7.8,3.001,7.8z M17.001,7.8
C15.786,7.8,14.8,8.785,14.8,10s0.986,2.2,2.201,2.2S19.2,11.215,19.2,10S18.216,7.8,17.001,7.8z"/>
                                    </svg>
                                </button> -->

                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
<!-- 
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 24 24" class="w-full h-full fill-current">
                                        <path
                                                d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-3.54-4.46a1 1 0 0 1 1.42-1.42 3 3 0 0 0 4.24 0 1 1 0 0 1 1.42 1.42 5 5 0 0 1-7.08 0zM9 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                                    </svg>
                                </button> -->
                            </div>
                            <!-- 文本信息 -->

                        </div>
                        <!-- 信息内容 -->
                    </div>
                    <!-- 发送者sender -->

                <!-- 更新时间 -->
                    <p class="p-4 text-center text-sm text-gray-500">FRI 3:04 PM</p>
                <!-- 更新时间 -->

                    <!-- 接收者 reveicer -->
                    <div class="flex flex-row justify-end">
                        
                        <div class="messages text-sm text-white grid grid-flow-row gap-2">
                            <!-- 图片信息 -->
                            <div class="flex items-center flex-row-reverse group">
                                <a class="block w-64 h-64 relative flex flex-shrink-0 max-w-xs lg:max-w-md" href="#">
                                    <img class="absolute shadow-md w-full h-full rounded-l-lg object-cover" src="https://unsplash.com/photos/8--kuxbxuKU/download?force=true&w=640" alt="hiking"/>
                                </a>
                                
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
                                
                            </div>
                            <!-- 图片信息 -->

                            <!-- 文本信息 -->
                            <div class="flex items-center flex-row-reverse group">
                                <p class="px-6 py-3 rounded-t-full rounded-l-full bg-blue-700 max-w-xs lg:max-w-md">Hey! How are you?</p>
                               
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
                                
                            </div>

                            <div class="flex items-center flex-row-reverse group">
                                <p class="px-6 py-3 rounded-l-full bg-blue-700 max-w-xs lg:max-w-md">Shall we go for Hiking this weekend?</p>
                               
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
                                
                            </div>

                            <div class="flex items-center flex-row-reverse group">
                                <p class="px-6 py-3 rounded-b-full rounded-l-full bg-blue-700 max-w-xs lg:max-w-md">Lorem ipsum
                                    dolor sit
                                    amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                                    dolore magna aliqua. Volutpat lacus laoreet non curabitur gravida.</p>
                               
                                <button type="button" class="hidden group-hover:block flex flex-shrink-0 focus:outline-none mx-2 block rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-700 bg-gray-800 w-8 h-8 p-2">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M19,16.685c0,0-2.225-9.732-11-9.732V2.969L1,9.542l7,6.69v-4.357C12.763,11.874,16.516,12.296,19,16.685z"/>
                                    </svg>
                                </button>
                               
                            </div>
                            <!-- 文本信息 -->
                        </div>
                    </div>
                    <!-- 接收者 reveicer -->
                </div>
                <!-- 对话流 -->

                <!-- 底部发送消息栏目 -->
                <div class="chat-footer flex-none">
                    <div class="flex flex-row items-center p-4">
                        <!-- <button type="button" class="flex flex-shrink-0 focus:outline-none mx-2 block text-blue-600 hover:text-blue-700 w-6 h-6">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                <path d="M10,1.6c-4.639,0-8.4,3.761-8.4,8.4s3.761,8.4,8.4,8.4s8.4-3.761,8.4-8.4S14.639,1.6,10,1.6z M15,11h-4v4H9  v-4H5V9h4V5h2v4h4V11z"/>
                            </svg>
                        </button> -->
                        <button type="button" class="flex flex-shrink-0 focus:outline-none mx-2 block text-blue-600 hover:text-blue-700 w-6 h-6">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                <path d="M11,13 L8,10 L2,16 L11,16 L18,16 L13,11 L11,13 Z M0,3.99406028 C0,2.8927712 0.898212381,2 1.99079514,2 L18.0092049,2 C19.1086907,2 20,2.89451376 20,3.99406028 L20,16.0059397 C20,17.1072288 19.1017876,18 18.0092049,18 L1.99079514,18 C0.891309342,18 0,17.1054862 0,16.0059397 L0,3.99406028 Z M15,9 C16.1045695,9 17,8.1045695 17,7 C17,5.8954305 16.1045695,5 15,5 C13.8954305,5 13,5.8954305 13,7 C13,8.1045695 13.8954305,9 15,9 Z" />
                            </svg>
                        </button>
                        <!-- <button type="button" class="flex flex-shrink-0 focus:outline-none mx-2 block text-blue-600 hover:text-blue-700 w-6 h-6">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                <path d="M0,6.00585866 C0,4.89805351 0.893899798,4 2.0048815,4 L5,4 L7,2 L13,2 L15,4 L17.9951185,4 C19.102384,4 20,4.89706013 20,6.00585866 L20,15.9941413 C20,17.1019465 19.1017876,18 18.0092049,18 L1.99079514,18 C0.891309342,18 0,17.1029399 0,15.9941413 L0,6.00585866 Z M10,16 C12.7614237,16 15,13.7614237 15,11 C15,8.23857625 12.7614237,6 10,6 C7.23857625,6 5,8.23857625 5,11 C5,13.7614237 7.23857625,16 10,16 Z M10,14 C11.6568542,14 13,12.6568542 13,11 C13,9.34314575 11.6568542,8 10,8 C8.34314575,8 7,9.34314575 7,11 C7,12.6568542 8.34314575,14 10,14 Z"/>
                            </svg>
                        </button> -->
                        <!-- <button type="button" class="flex flex-shrink-0 focus:outline-none mx-2 block text-blue-600 hover:text-blue-700 w-6 h-6">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                <path d="M9,18 L9,16.9379599 C5.05368842,16.4447356 2,13.0713165 2,9 L4,9 L4,9.00181488 C4,12.3172241 6.6862915,15 10,15 C13.3069658,15 16,12.314521 16,9.00181488 L16,9 L18,9 C18,13.0790094 14.9395595,16.4450043 11,16.9378859 L11,18 L14,18 L14,20 L6,20 L6,18 L9,18 L9,18 Z M6,4.00650452 C6,1.79377317 7.79535615,0 10,0 C12.209139,0 14,1.79394555 14,4.00650452 L14,8.99349548 C14,11.2062268 12.2046438,13 10,13 C7.790861,13 6,11.2060545 6,8.99349548 L6,4.00650452 L6,4.00650452 Z" />
                            </svg>
                        </button> -->
                        <div class="relative flex-grow">
                            <label>
                                <input v-model="roomView.content" class="rounded-full py-2 pl-3 pr-10 w-full border border-gray-800 focus:border-gray-700 bg-gray-800 focus:bg-gray-900 focus:outline-none text-gray-200 focus:shadow-md transition duration-300 ease-in"
                                       type="text"  placeholder="Aa"/>
                                <button type="button" class="absolute top-0 right-0 mt-2 mr-3 flex flex-shrink-0 focus:outline-none block text-blue-600 hover:text-blue-700 w-6 h-6">
                                    <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                        <path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM6.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.16 3a6 6 0 0 1-11.32 0h11.32z" />
                                    </svg>
                                </button>
                            </label>
                        </div>
                        <button @click="onSend" type="button" class="flex flex-shrink-0 focus:outline-none mx-2 block text-blue-600 hover:text-blue-700 w-6 h-6">
                            <svg viewBox="0 0 20 20" class="w-full h-full fill-current">
                                <path d="M11.0010436,0 C9.89589787,0 9.00000024,0.886706352 9.0000002,1.99810135 L9,8 L1.9973917,8 C0.894262725,8 0,8.88772964 0,10 L0,12 L2.29663334,18.1243554 C2.68509206,19.1602453 3.90195042,20 5.00853025,20 L12.9914698,20 C14.1007504,20 15,19.1125667 15,18.000385 L15,10 L12,3 L12,0 L11.0010436,0 L11.0010436,0 Z M17,10 L20,10 L20,20 L17,20 L17,10 L17,10 Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <!-- 底部发送消息栏目 -->

            </section>
            <!-- 聊天室视图 -->

            <section v-else class="flex flex-col flex-auto border-l border-gray-800">
                
                 <div className="hero-content flex-col lg:flex-row-reverse">
                    <div className="text-center lg:text-center">
                        <p className="py-6">Hello,Motherfucker.</p>
                    </div>
                </div>
            </section>
        </main>
    </div>
</div>
</template>

<style scoped>
/* can be configured in tailwind.config.js */
.group:hover .group-hover\:block {
    display: block;
}

.hover\:w-64:hover {
    width: 45%;
}


/* NO NEED THIS CSS - just for custom scrollbar which can also be configured in tailwind.config.js*/
::-webkit-scrollbar {
    width: 2px;
    height: 2px;
}

::-webkit-scrollbar-button {
    width: 0px;
    height: 0px;
}

::-webkit-scrollbar-thumb {
    background: #2d3748;
    border: 0px none #ffffff;
    border-radius: 50px;
}

::-webkit-scrollbar-thumb:hover {
    background: #2b6cb0;
}

::-webkit-scrollbar-thumb:active {
    background: #000000;
}

::-webkit-scrollbar-track {
    background: #1a202c;
    border: 0px none #ffffff;
    border-radius: 50px;
}

::-webkit-scrollbar-track:hover {
    background: #666666;
}

::-webkit-scrollbar-track:active {
    background: #333333;
}

::-webkit-scrollbar-corner {
    background: transparent;
}
</style>