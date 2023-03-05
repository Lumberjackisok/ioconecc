<script lang="ts">
export default {
    name: "HomeView",
    components: { TypingText, loding }
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { search, getHistory, notifyList, createGroup, updateMessageStatus, updateMessageByIds } from '../https/index';
import { useUserStore } from '@/stores/modules/user';
import { baseURL } from '../privateKeys/index';
import io from 'socket.io-client';
import { notifyFormatter } from '../utils/time'
import TypingText from '@/components/TypingText.vue';
import loding from '../components/Loading.vue';


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
    console.log('服务器监听到message,转发过来的数据:', data.data[data.data.length - 1]);
    if (data.message === 'go get update') {
        getNotifyList();//获取最新的信息预览通知
        message.list.push(data.data[data.data.length - 1]);
        //收到消息后，当页面本身就是触底的时，才再次触发触底
        if (chatBody.value.scrollTop + chatBody.value.clientHeight >= chatBody.value.scrollHeight - 2) {
            scrollToBottom();
        }
    }
});

console.log('in home page,userInfo:', userStore.userInfo);

const state: any = reactive({
    searchContent: '',
    searchList: [],
    searchPage: 1,
    searchDatas: null,
    isSeachOnload: false,
    notifyList: [],
    blueCircleIsShow: 1,//控制蓝色圈圈是否显示
});

//聊天窗口数据
const roomView: any = reactive({
    receiverInfo: null,
    content_type: 1,
    content: '',
    groupId: "",
    close: 0,//控制显示聊天室画面
    showToBottomButton: false,//控制是否显示点击触底按钮和未读消息计数
    notReadCount: 0,//未读数量
});


//聊天数据
const message: any = reactive({
    list: []
});

//点击搜索
const onSearch = async () => {
    state.searchPage = 1;
    try {
        let datas: any = await search(state.searchContent, state.searchPage, 10);
        console.log('搜索：', datas);
        if (datas.status == 200) {
            state.searchList = datas.users;
            state.searchDatas = {
                currentPage: datas.currentPage,
                total: datas.total,
                totalPages: datas.totalPages
            }

        }
    } catch (e) {
        console.log(e);
    }
};
//点击搜索

//点击搜索列表或聊天列表后，开启单聊聊天室
const goChat = async (receiverInfo: any, isNewChat: number) => {
    roomView.close = 0;//是否关闭聊天窗口
    roomView.receiverInfo = receiverInfo;
    console.log('点击后对应的用户信息:', receiverInfo);

    /**
     * 
     * 
    */
    //如果是新建聊天就创建聊天室
    if (isNewChat === 1) {
        try {
            const name = userStore.userInfo._id + " " + receiverInfo._id;
            const datas2: any = await createGroup(name, 1);
            myGetHistory(receiverInfo._id);
            if (datas2.status === 200) {
                console.log('创建聊天室：', datas2);
                roomView.groupId = datas2.group._id;
            }

        } catch (err) {
            console.log(err);
        }
    } else {//处理非新创建聊天室的情况
        try {
            console.log('非新创建聊天', roomView.receiverInfo);

            roomView.groupId = roomView.receiverInfo.notify.group;//对应的groupId更新过去

            //先获取历史记录
            let datas: any = await getHistory(roomView.receiverInfo._id);
            if (datas.status === 200) {
                message.list = datas.datas.message;
                console.log('跳转到聊天界面的聊天历史记录:', datas);

                //获取未读消息的条数
                const notReadCount = datas.datas.message.filter((item: any) => {
                    return item.isRead == 0;
                }).length;

                console.log('未读消息数量：', notReadCount);

                //如果最新的一条消息的接收者不是自己的id就直接触底
                if (datas.datas.message[datas.datas.message.length - 1].receiver != userStore.userInfo._id) {
                    roomView.showToBottomButton = false;
                    roomView.notReadCount = 0;
                    scrollToBottom();
                } else if (notReadCount == 0) {//如果最新的消息的接收者是自己，但notReadCount=0，同样直接触底
                    scrollToBottom();
                } else {//如果最新的消息的接收者是自己,并且notReadCount！=0，就scroll到最前面那条未读消息的位置
                    roomView.notReadCount = notReadCount;
                    roomView.showToBottomButton = notReadCount == 0 ? false : true;

                    //按时间戳降序排序，再过滤掉已读的，取第一个,就是对应的消息的dom的id
                    const scrollToRead = message.list.sort((a: any, b: any) => {
                        return a.updateAt - b.updateAt
                    }).filter((item: any) => { return item.isRead == 0 })[0]._id;

                    console.log("scrollToRead:", scrollToRead);

                    //获取dom，在setTimeout内的目的是让dom加载完毕后再去获取
                    setTimeout(() => {
                        let firstNotReadDom: any = document.getElementById(scrollToRead);
                        console.log('firstNotReaDdom:', firstNotReadDom);
                        if (firstNotReadDom) {
                            //直接使用scrollIntoView()方法
                            firstNotReadDom.scrollIntoView();
                        }
                    }, 10);
                }
            }

            getNotifyList();

        } catch (err) {
            console.log(err);
        }
    }
};
//点击搜索列表或聊天列表后，开启聊天室


//点击发送消息
const onSend = async () => {
    console.log("roomView.receiverInfo:", roomView.receiverInfo);
    if (roomView.content != '') {
        const sendData = {
            // isGroup: 0,//是否群组，默认否,如果是单聊就服务端处理翻译
            sender: userStore.userInfo._id,//自己的id
            receiver: roomView.receiverInfo._id,//要发送信息给那个人的id
            contentType: 1,//1:文本，2：图片,暂时默认写死1，后期再根据实际做判断
            content: roomView.content,//发送的信息内容
            receiverLanguage: roomView.receiverInfo.language,//对方的母语
            senderLanguage: userStore.userInfo.language,//自己的母语
            isRead: 0,//0：未读，1：已读,默认未读
            groupId: roomView.groupId,
        };

        message.list.push(sendData);
        roomView.content = '';
        scrollToBottom();
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

//更新已读状态
const postUpdateMessageStatus = async () => {
    try {
        let datas: any = await updateMessageStatus(roomView.receiverInfo._id);
        console.log('更新已读状态：', datas);
    } catch (err) {
        console.log(err);
    }
}

//聊天界面容器触底方法
const chatBody: any = ref(null);
const scrollToBottom = () => {
    const timer = setInterval(() => {
        chatBody.value.scrollTop += 30;
        if (chatBody.value.scrollTop + chatBody.value.clientHeight >=
            chatBody.value.scrollHeight - 2) {
            clearInterval(timer);
            roomView.showToBottomButton = false;
            roomView.notReadCount = 0;
        }
    }, 11)
}
//聊天界面容器触底方法


// 当聊天界面滚动
//用于监测停止滚动的定时器
let isScrolling: any = null;
const chatBodyScroll = () => {
    try {
        //如果往上滚动，显示触底按钮
        if (chatBody.value.scrollTop + chatBody.value.clientHeight < chatBody.value.scrollHeight - 2) {
            roomView.showToBottomButton = true;
        }

        //如果滚动触底，隐藏按钮，计数归零  
        if (chatBody.value.scrollTop + chatBody.value.clientHeight >= chatBody.value.scrollHeight - 2) {
            roomView.showToBottomButton = false;
            roomView.notReadCount = 0;

            /**
             * 如果最后一条消息是自己发送的，即最后一条消息的sender=自己的id，
             * 即自己是发送者，
             * 以及最后一条消息的已读状态为1,
             * 则不更新消息状态为已读,
             * 但是如果是自己发送的，并且不更新，那么计数和向下按钮也会为自己显示，
             * 所以，在点击消息预览后，如果最新的一条消息的接收者不是自己的id就直接触底，具体在gochat()方法内
            */
            if (message.list[message.list.length - 1].sender != userStore.userInfo._id && message.list[message.list.length - 1].isRead == 0) {
                // postUpdateMessageStatus();
                scrollToBottom();
            }
        } else {
            let currentScrollTop = chatBody.value.scrollTop;
            let currentClientHeight = chatBody.value.clientHeight;
            //更新未读的计数
            if (roomView.notReadCount <= 0) {
                roomView.notReadCount = 0;
            }

            roomView.notReadCount--;
            let idsArray: any = [];
            for (let i = 0; i < message.list.length; i++) {
                /**
                 * 如果dom.offsetTop - dom.clientHeight<=currentScrollTop + currentClientHeight，
                 * 说明这些dom为可视范围内的和已经被顶上去的，即都是用户已读的，
                 * 当停止滚动后，将这些id装到数组内,将对应的message为未读的id过滤出来，
                 * 最后将过滤出来的id发送给服务器，服务器操作数据库将这些id更新为已读状态
                 * */
                const dom: any = document.getElementById(message.list[i]._id);
                if ((dom.offsetTop - dom.clientHeight) <= (currentScrollTop + currentClientHeight)) {
                    // console.log("所有已读的dom:", dom.id, dom);
                    idsArray.push(dom.id);
                    clearTimeout(isScrolling);
                    isScrolling = setTimeout(async () => {
                        //全部被用户已读的id，但存在数据库里有一部分已经更新了的情况，
                        //需要将这些已经更新了的id过滤出来，最后将过滤出来的id发送给服务器，服务器操作数据库将这些id更新为已读状态
                        let finalyNotreadIds = message.list.filter((item: any, index: number) => { return item.isRead == 0 && item._id == idsArray[index] }).map((item: any) => { return item._id });
                        console.log('停止滚动了,全部被用户已读的id', idsArray);
                        console.log('停止滚动了,全部被用户已读的id中数据库还没更新的id', finalyNotreadIds);

                        if (finalyNotreadIds.length > 0 && roomView.notReadCount != 0) {
                            let datas: any = await updateMessageByIds(finalyNotreadIds);
                            roomView.showToBottomButton = roomView.notReadCount <= 0 && chatBody.value.scrollTop + chatBody.value.clientHeight >= chatBody.value.scrollHeight - 2 ? false : true;
                            console.log('按id更新状态', datas);
                        }
                    }, 1000);
                }

            }
        }
    } catch (err) {
        console.log(err);
    }
}
// 当聊天界面滚动



// 搜索列表加载更多方法
/**
 * 1.获取滚动节点 const searchListBody: any = ref(null);
 * 2.在节点的onScroll事件内判断是否滚动触底： if (searchListBody.value.scrollTop + searchListBody.value.clientHeight >=
 *          searchListBody.value.scrollHeight - 2){处理加载更多}
 * 
*/
let searchListBody: any = ref(null);
const loadMoreSearch = async () => {
    if (state.searchPage == state.searchDatas.totalPages) {
        return;
    }

    if (searchListBody.value.scrollTop + searchListBody.value.clientHeight >= searchListBody.value.scrollHeight - 2) {
        console.log('触底了');
        state.searchPage++;
        state.isSeachOnload = true;
        try {
            let datas: any = await search(state.searchContent, state.searchPage, 10);
            if (datas.status == 200) {
                state.searchList = state.searchList.concat(datas.users);
                state.searchDatas = {
                    currentPage: datas.currentPage,
                    total: datas.total,
                    totalPages: datas.totalPages
                }
                state.isSeachOnload = false;
            }
        } catch (err) {
            console.log(err);
        }
    }
}
// 搜索列表加载更多方法

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
                <div class="header p-4 flex flex-row justify-between items-center flex-none ">
                    <div @click="roomView.close = 1" class="w-10 h-10 relative flex flex-shrink-0 cursor-pointer" style="">
                        <img class="rounded-5 w-full h-full object-cover" alt=""
                             src="../assets/saturn2.ico"/>
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
                        <div v-if="userStore.userInfo._id != item.notify.sender && item.notify.isRead == 0 && !roomView.showToBottomButton" class="bg-blue-700 w-3 h-3 rounded-full flex flex-shrink-0 hidden md:block group-hover:block"></div>
                    </div>
                <!-- 用户名、最新收到的信息、时间 -->
                    
                </div>
                  <!-- 消息预览列表 -->


                  <!-- 搜索用户列表 -->
                <div v-if="state.searchContent != ''" class="contacts p-2 flex-1 overflow-y-scroll" ref="searchListBody" @scroll="loadMoreSearch">
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
                    <div class="flex justify-center"><loding :isLoading="state.isSeachOnload"></loding></div>
                </div>
                  <!-- 搜索用户列表 -->
                  
            </section>

            <!-- 聊天室视图 -->
            <section v-if="roomView.receiverInfo && roomView.close == 0" class="flex flex-col flex-auto border-l border-gray-800">
                
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
                            <p>some text here...</p>
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
                <div class="chat-body p-4 flex-1 overflow-y-scroll" ref="chatBody" @scroll="chatBodyScroll" id="chatBody-container">
                    
                    <!-- 别人文本消息 others -->
                    <template v-for="item, index in message.list" :key="index">
                        
                     
                        <div :class="userStore.userInfo._id == item.receiver && item.contentType == 1 ? 'flex flex-row justify-start mt-1' : 'flex justify-start flex-row-reverse mt-3'">
                            <!-- 头像 -->
                            <div  class="flex items-center justify-center h-10 w-10 rounded-full  flex-shrink-0 mr-4 ml-2">
                                <img class="shadow-md rounded-full w-full h-full object-cover"
                                            :src="userStore.userInfo._id == item.receiver && item.contentType == 1 ? roomView.receiverInfo.avatar : userStore.userInfo.avatar"
                                            alt="" />
                            </div>
                            <!-- 头像 -->

                        <!-- 信息内容 -->
                            <div class="messages text-sm text-white grid grid-flow-row gap-2" :id="item._id">
                                <!-- 文本信息 -->
                                <div :class="userStore.userInfo._id == item.receiver && item.contentType == 1 ? 'flex items-center group' : 'flex items-center flex-row-reverse group'">
                                    <p :class="userStore.userInfo._id == item.receiver && item.contentType == 1 ? 'px-6 py-3 rounded-t-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md' : 'px-6 py-3 rounded-t-full rounded-l-full bg-blue-700 max-w-xs lg:max-w-md'">{{ item.content }}</p>
                                </div>

                                <!-- 翻译文本 有动效-->
                                <div v-if="(userStore.userInfo._id == item.receiver && item.contentType == 1)" class="flex items-center group mb-4 -mt-1">
                                    <p class="px-6 py-3 rounded-b-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200"><TypingText :text="item.translatedContent"></TypingText></p>
                                </div>
                                <!-- 翻译文本 有动效-->

                                <!-- 翻译文本 无动效-->
                                <!-- <div v-if="(userStore.userInfo._id == item.receiver && item.contentType == 1)" class="flex items-center group mb-4 -mt-1">
                                    <p class="px-6 py-3 rounded-b-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200">translated text here,no animation</p>
                                </div> -->
                                <!-- 翻译文本 无动效-->

                                <!-- 文本信息 -->

                                <!-- 图片信息 -->
                            <div v-if="(userStore.userInfo._id == item.receiver && item.contentType == 2)" calss="flex items-center group">
                                        <a class="block w-64 h-64 relative flex flex-shrink-0 max-w-xs lg:max-w-md" href="#">
                                            <img class="absolute shadow-md w-full h-full rounded-r-lg object-cover" :src="roomView.receiverInfo.avatar" alt="hiking"/>
                                        </a>
                                </div>
                                <!-- 图片信息 -->
                            
                            </div>
                            <!-- 信息内容 -->
                        </div>
                   </template>
                    <!--别人文本消息 others -->

                   

                    <!-- 更新时间 -->
                    <!-- <p class="p-4 text-center text-sm text-gray-500">FRI 3:04 PM</p> -->
                    <!-- 更新时间 -->


                    <!-- 触底按钮和未读计数 -->
                    <div v-if="roomView.showToBottomButton" @click="scrollToBottom" class="fixed bottom-20 right-8 flex flex-col items-center">
                       <div v-if="roomView.notReadCount > 0" class="flex justify-center absolute -top-2">{{ roomView.notReadCount }}</div>
                        <button className="btn btn-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <!-- 触底按钮和未读计数 -->

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
                        
                   <TypingText text="Hello Madafruka "></TypingText>
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