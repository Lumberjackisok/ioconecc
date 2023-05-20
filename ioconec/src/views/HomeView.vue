<script lang="ts">
export default {
    name: "HomeView",
    components: { TypingText, loding }
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { search, getHistory, notifyList, createGroup, updateMessageByIds } from '../https/index';
import { useUserStore } from '@/stores/modules/user';
import { baseURL } from '../privateKeys/index';
import io from 'socket.io-client';
import { notifyFormatter } from '../utils/time';
import { initViretualMesssage, sliceMessage } from '../utils/handleMessageList';

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
    console.log('服务器监听到message,转发过来的数据:', data.data[0], roomView.receiverInfo);
    try {
        if (data.message === 'go get update' && data.data[0].receiver == userStore.userInfo._id && roomView.close == 0) {
            /**处理单聊
             * 
             * 如果用户打开的是与发送来消息的人的聊天窗口，才执行以下操作
             * sender==roomView.receiverInfo._id,
             * 或者receiver==userStore.userInfo._id
            */
            //收到消息后，当页面本身就是触底的时，才再次触发触底
            // console.log('单聊消息来了', data.data[0], roomView.receiverInfo._id);

            if (chatBody.value.scrollTop + chatBody.value.clientHeight >= chatBody.value.scrollHeight - 15 && roomView.isOne2One && roomView.receiverInfo._id == data.data[0].sender) {
                //push进去，实现触底效果
                message.list.push(data.data[0]);
                virtualMessage.list.push(data.data[0]);
                // virtualMessage.list = message.list.slice(message.list.length - 20, message.list.length);
                scrollToBottom(10);
            }

            //更新历史消息列表
            await myGetHistory(data.data[0].sender);

            await getNotifyList();//获取最新的信息预览通知
            // console.log("roomView.receiverInfo._id:", roomView.receiverInfo._id);

        } else if (roomView.isOne2One != 1) {
            //处理群聊
            // console.log('群聊消息来了', data.data[0].group, roomView.receiverInfo._id);
            if (chatBody.value.scrollTop + chatBody.value.clientHeight >= chatBody.value.scrollHeight - 15 && roomView.isOne2One != 1 && roomView.receiverInfo._id == data.data[0].group) {
                //push进去，实现触底效果
                // message.list.push(data.data[0]);
                // console.log('data.data[0].readStatus:', data.data[0].readStatus);

                virtualMessage.list.push(data.data[0]);

                scrollToBottom(10);
            }

            //更新历史消息列表
            await myGetHistory(data.data[0].group);

            await getNotifyList();//获取最新的信息预览通知
        } else {
            await getNotifyList();//获取最新的信息预览通知
        }
    } catch (e) {
        console.log(e);
        await getNotifyList();//获取最新的信息预览通知
    }

});

// console.log('in home page,userInfo:', userStore.userInfo);

const state: any = reactive({
    searchContent: '',
    searchList: [],
    searchPage: 1,
    searchDatas: null,
    isSeachOnload: false,
    notifyList: {},
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
    index: 0,//当前聊天窗口对应的notify循环列表的索引
    isOne2One: 1,//是否为群聊
});

//群聊窗口数据
const groupView: any = reactive({
    groupId: "",
});


//聊天数据
const message: any = reactive({
    list: []
});

//搜索用户
const onSearch = async (isSearchingForMessage = 1) => {
    if (addMembers.searchContent == '') {
        addMembers.searchList = [];
    }
    if (state.searchContent == '') {
        state.searchList = [];
    }
    if (addMembers.searchContent != '' || state.searchContent != '') {
        try {
            if (isSearchingForMessage == 1) {
                state.searchPage = 1;
                let datas: any = await search(state.searchContent, state.searchPage, 10);
                // console.log('搜索：', datas);
                if (datas.status == 200) {
                    //过滤掉自己
                    let excepter = datas.users.filter((item: any) => {
                        return item._id != userStore.userInfo._id;
                    });
                    state.searchList = excepter;
                    state.searchDatas = {
                        currentPage: datas.currentPage,
                        total: datas.total,
                        totalPages: datas.totalPages
                    }
                }
            } else {

                let datas: any = await search(addMembers.searchContent, addMembers.searchPage, 3);
                if (datas.status == 200) {
                    //过滤掉自己
                    let excepter = datas.users.filter((item: any) => {
                        return item._id != userStore.userInfo._id;
                    });

                    addMembers.searchList = excepter;
                    addMembers.searchDatas = {
                        currentPage: datas.currentPage,
                        total: datas.total,
                        totalPages: datas.totalPages
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

};

//搜索用户

//点击搜索列表或聊天列表后，开启单聊聊天室
//三个参数：对方信息，是否为新创建聊天室，notify卡片循环列表对应的下标
const goChat = async (receiverInfo: any, isNewChat: number, index: number) => {

    roomView.content = '';

    roomView.close = 0;//是否关闭聊天窗口
    roomView.receiverInfo = receiverInfo;

    roomView.index = index;//拿到notify卡片循环列表对应的下标，用于滚动事件中判断是否需要触底更新的引路

    console.log('点击后对应的用户信息:', receiverInfo, index);

    //如果是新建聊天就创建聊天室
    if (isNewChat === 1) {
        try {
            //清空聊天室消息
            message.list = [];
            virtualMessage.list = [];

            const name = userStore.userInfo._id + " " + receiverInfo._id;
            const datas2: any = await createGroup(name, 1);
            await myGetHistory(receiverInfo._id);
            if (datas2.status === 200) {
                console.log('创建聊天室：', datas2);
                roomView.groupId = datas2.group._id;
            }

        } catch (err) {
            console.log(err);
        }
    } else {
        //处理非新创建聊天室的情况
        //判断是否为群聊，如果点开的是群聊。让当前客户端加入聊天室
        if (receiverInfo.isOne2One == 0) {
            try {
                console.log('是群聊');
                roomView.isOne2One = 0;

                //更新群组id，更新之前需要离开上一次的
                let groupId = groupView.groupId
                socket.emit('leave room', groupId);
                groupView.groupId = receiverInfo._id;
                //更新后的群组id加入聊天室
                socket.emit('join room', receiverInfo._id);

                //清空聊天室消息， 清空后再重新获取聊天记录
                message.list = [];
                virtualMessage.list = [];

                await myGetHistory(groupView.groupId);//获取聊天历史

                //初始化最终渲染的聊天记录，返回初始化后的要显示的聊天记录和下标
                const { _virtualMessage, _startIndex, _endIndex } = initViretualMesssage(message.list, 20)
                virtualMessage.list = _virtualMessage;
                virtualMessage.startIndex = _startIndex;
                virtualMessage.endIndex = _endIndex;

                //获取未读消息
                //获取未读消息

                // roomView.notReadCount = notReadCount.length;
                const notReadCount = virtualMessage.list.filter((item: any) => {
                    return item.isRead == 0;
                });
                // roomView.notReadCount = notReadCount.length;
                // console.log('未读消息：', notReadCount);


                //如果最新的一条消息的发送者是自己的id就直接触底
                if (message.list[message.list.length - 1].sender == userStore.userInfo._id) {
                    roomView.showToBottomButton = false;
                    // roomView.notReadCount = 0;
                    scrollToBottom(10);
                } else if (notReadCount.length == 0) {
                    //如果最新的消息的接收者是自己，但notReadCount.length=0，同样直接触底
                    scrollToBottom(10);
                } else {
                    //如果最新的消息的接收者是自己,并且notReadCount！=0，就scroll到最前面那条未读消息的位置
                    // roomView.notReadCount = notReadCount.length;
                    roomView.showToBottomButton = notReadCount.length == 0 ? false : true;

                    //按时间戳降序排序，再过滤掉已读的，取第一个,就是对应的消息的dom的id,
                    //因为在渲染的时候就把id动态绑定上去了，
                    //也就是说：message._id = DOM的id
                    const scrollToRead = virtualMessage.list.filter((item: any) => { return item.isRead == 0 })[0]._id;
                    // console.log("message.list.filter((item: any) => { return item.isRead == 0 }):", message.list.filter((item: any) => { return item.isRead == 0 }));

                    // console.log("scrollToRead:", scrollToRead);

                    //获取dom，在setTimeout内的目的是让dom加载完毕后再去获取
                    setTimeout(() => {
                        let firstNotReadDom: any = document.getElementById(scrollToRead);
                        // console.log('firstNotReaDdom:', firstNotReadDom);
                        if (firstNotReadDom) {
                            //直接使用scrollIntoView()方法
                            firstNotReadDom.scrollIntoView();
                        }
                    }, 10);
                }
            } catch (e) {
                console.log(e);
            }


        } else {
            try {
                console.log('不是群聊', roomView.receiverInfo);
                roomView.isOne2One = 1;
                roomView.groupId = roomView.receiverInfo.notify.group;//对应的groupId更新过去

                //清空聊天室消息， 清空后再重新获取聊天记录
                message.list = [];
                virtualMessage.list = [];

                await myGetHistory(roomView.receiverInfo._id);//获取聊天历史

                //初始化最终渲染的聊天记录，返回初始化后的要显示的聊天记录和下标
                const { _virtualMessage, _startIndex, _endIndex } = initViretualMesssage(message.list, 20)
                virtualMessage.list = _virtualMessage;
                virtualMessage.startIndex = _startIndex;
                virtualMessage.endIndex = _endIndex;

                //获取未读消息
                const notReadCount = virtualMessage.list.filter((item: any) => {
                    return item.isRead == 0;
                });
                // roomView.notReadCount = notReadCount.length;
                // console.log('未读消息：', notReadCount);

                //如果最新的一条消息的接收者不是自己的id就直接触底
                if (message.list[message.list.length - 1].receiver != userStore.userInfo._id) {
                    roomView.showToBottomButton = false;
                    // roomView.notReadCount = 0;
                    scrollToBottom(10);
                } else if (notReadCount.length == 0) {
                    //如果最新的消息的接收者是自己，但notReadCount.length=0，同样直接触底
                    scrollToBottom(10);
                } else {
                    //如果最新的消息的接收者是自己,并且notReadCount！=0，就scroll到最前面那条未读消息的位置
                    // roomView.notReadCount = notReadCount.length;
                    roomView.showToBottomButton = notReadCount.length == 0 ? false : true;

                    //按时间戳降序排序，再过滤掉已读的，取第一个,就是对应的消息的dom的id,
                    //因为在渲染的时候就把id动态绑定上去了，
                    //也就是说：message._id = DOM的id
                    const scrollToRead = virtualMessage.list.filter((item: any) => { return item.isRead == 0 })[0]._id;
                    // console.log("message.list.filter((item: any) => { return item.isRead == 0 }):", message.list.filter((item: any) => { return item.isRead == 0 }));

                    // console.log("scrollToRead:", scrollToRead);

                    //获取dom，在setTimeout内的目的是让dom加载完毕后再去获取
                    setTimeout(() => {
                        let firstNotReadDom: any = document.getElementById(scrollToRead);
                        // console.log('firstNotReaDdom:', firstNotReadDom);
                        if (firstNotReadDom) {
                            //直接使用scrollIntoView()方法
                            firstNotReadDom.scrollIntoView();
                        }
                    }, 10);
                }
                // }


            } catch (err) {
                console.log(err);
            }
        }

    }
};
//点击搜索列表或聊天列表后，开启聊天室


//点击发送消息
const onSend = async () => {
    // console.log("roomView.receiverInfo:", roomView.receiverInfo);
    if (roomView.content != '') {


        //处理群聊
        if (roomView.receiverInfo.isOne2One == 0) {
            console.log('发送群聊消息');

            //群组内除自己之外的members
            const exceptMembers: any = roomView.receiverInfo.members.filter((item: any) => {
                return item != userStore.userInfo._id;
            });
            console.log('exceptMembers:', exceptMembers);

            //解构的方法取出对象内除某个字段外的其它所有字段
            const { token, ...exceptToken } = userStore.userInfo;
            console.log('exceptToken:', exceptToken);

            const sendData = {
                isOne2One: 0,//群聊
                sender: userStore.userInfo._id,//自己的id
                userInfo: exceptToken,//自己的信息
                senderLanguage: userStore.userInfo.language,//自己的母语
                receiver: roomView.receiverInfo._id,//群组id
                members: exceptMembers,//其它群组成员id（除自己外）
                contentType: 1,//1:文本，2：图片,暂时默认写死1，后期再根据实际做判断
                content: roomView.content,//发送的信息内容
                isRead: 0,//0：未读，1：已读,默认未读
                group: roomView.receiverInfo._id
            }
            // message.list.push(sendData);
            virtualMessage.list.push(sendData);
            roomView.content = '';
            scrollToBottom(10);
            //发送消息给服务端
            socket.emit('message', { sendData }, (data: any) => {
                // console.log('发送成功后服务器返回来的:', data);
            });
        } else {
            //处理单聊
            const sendData = {
                isOne2One: 1,//单聊
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
            virtualMessage.list.push(sendData);
            // virtualMessage.list = message.list.slice(message.list.length - 20, message.list.length);
            roomView.content = '';
            scrollToBottom(10);
            //发送消息给服务端
            socket.emit('message', { sendData }, (data: any) => {
                //发送成功的回调，可以写查找历史记录的业务，比如message.list = data;
                // message.list = data;
                // console.log('发送成功后服务器返回来的:', data);
            });
        }

    };
};
//点击发送消息


//获取聊天历史
const myGetHistory = async (receiver: any) => {
    try {
        let datas: any = await getHistory(receiver);
        if (datas.status === 200) {
            message.list = datas.datas.message;
            // console.log('聊天历史记录10086：', message.list[0]);

            //如果是群聊，需要处理readStatus问题
            if (message.list[0].group == message.list[0].receiver) {

                //处理群聊的readStatus问题
                message.list.forEach((item: any) => {
                    let index = item.readStatus.findIndex((item2: any) => {
                        return item2.member == userStore.userInfo._id;
                    })
                    if (index != -1) {
                        item.isRead = item.readStatus[index].isRead;
                    } else {
                        //说明自己是sender，既然自己是sender，说明isRead为1
                        item.isRead = 1;
                    }
                })
            }

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
            datas.frends.sort((a: any, b: any) => {
                return (b.notify?.updateAt || 0) - (a.notify?.updateAt || 0);
            })
            state.notifyList = datas;

            // roomView.notReadCount = state.notifyList.frends[roomView.index].notify.notreadCount;
        }

    } catch (err) {
        console.log(err);
    }
};


//聊天界面容器触底方法
const chatBody: any = ref(null);
const scrollToBottom = (messageLength: number = 10) => {

    /*
    如果消息长度大于20,过渡效果猛烈点，不要让页面滚动得太慢了
    */
    if (messageLength < 20) {
        const timer = setInterval(() => {
            chatBody.value.scrollTop += 30;
            if (chatBody.value.scrollTop + chatBody.value.clientHeight >=
                chatBody.value.scrollHeight - 2) {
                clearInterval(timer);
                roomView.showToBottomButton = false;
                // roomView.notReadCount = 0;
            }
        }, 11)
    } else {
        //直接触底
        chatBody.value.scrollTop = chatBody.value.scrollHeight;
    }
}
//聊天界面容器触底方法

//用于对聊天记录的性能优化
const virtualMessage: any = reactive({
    list: [],
    startIndex: 0,
    endIndex: 0,
    hasTopMore: true,
    hasBottomMore: true,
    size: 20
});
//用于对聊天记录的性能优化

// 当聊天界面滚动
//用于监测停止滚动的定时器
let isScrolling: any = null;
let conut = 0;//目的是控制触底后只触发一次，在非向下触底的情况下conut都需要等于0
const chatBodyScroll = () => {
    try {
        conut = 0;//非向下触底的情况下conut都等于0了
        let currentScrollTop = chatBody.value.scrollTop;
        let currentClientHeight = chatBody.value.clientHeight;

        //如果往上滚动，显示触底按钮
        if (chatBody.value.scrollTop + chatBody.value.clientHeight < chatBody.value.scrollHeight - 2) {
            roomView.showToBottomButton = true;

            //如果触顶了
            if (chatBody.value.scrollTop == 0) {

                let virtualDom = document.getElementById(virtualMessage.list[virtualMessage.size - 1]._id);
                console.log('触顶了');
                /**
                 * 先获取到virtualMessage未更新时最顶部的dom，
                 * 用于virtualMessage更新后使用dom.scrollIntoView({behavior: 'instant'})方法，
                 * 没有过渡效果地滚动到dom，使其具有连贯性。
                 * */

                // setTimeout(() => {


                // console.log("_sliceMessage", _sliceMessage);


                if (virtualMessage.list.length >= virtualMessage.size && virtualMessage.list.length < virtualMessage.size * 2 && virtualDom) {

                    const { _sliceMessage, _startIndex, _endIndex, _hasTopMore, _hasBottomMore } = sliceMessage('top', virtualMessage.hasTopMore, virtualMessage.hasBottomMore, message.list, virtualMessage.list.length, virtualMessage.size, virtualMessage.startIndex, virtualMessage.endIndex);
                    virtualMessage.startIndex = _startIndex;
                    virtualMessage.endIndex = _endIndex;
                    virtualMessage.hasTopMore = _hasTopMore;
                    virtualMessage.hasBottomMore = _hasBottomMore;

                    let tempArr = [..._sliceMessage, ...virtualMessage.list];
                    virtualMessage.list = tempArr;
                    // console.log("tempArr", tempArr);
                    virtualDom!.scrollIntoView();

                } else if (virtualMessage.list.length >= virtualMessage.size * 2 && virtualDom) {

                    const { _sliceMessage, _startIndex, _endIndex, _hasTopMore, _hasBottomMore } = sliceMessage('top', virtualMessage.hasTopMore, virtualMessage.hasBottomMore, message.list, virtualMessage.list.length, virtualMessage.size, virtualMessage.startIndex, virtualMessage.endIndex);
                    virtualMessage.startIndex = _startIndex;
                    virtualMessage.endIndex = _endIndex;
                    virtualMessage.hasTopMore = _hasTopMore;
                    virtualMessage.hasBottomMore = _hasBottomMore;

                    let sliceVirtualMessage = virtualMessage.list.slice(0, virtualMessage.size);
                    let tempArr = [..._sliceMessage, ...sliceVirtualMessage];
                    virtualMessage.list = tempArr;
                    // virtualMessage.hasBottomMore = true;
                    virtualDom!.scrollIntoView();
                }
                // }, 50);
            }
        }

        /**
            * 如果最后一条消息是自己发送的，即最后一条消息的sender=自己的id，
            * 即自己是发送者，
            * 以及最后一条消息的已读状态为1,
            * 则不更新消息状态为已读,
            * 但是如果是自己发送的，并且不更新，那么计数和向下按钮也会为自己显示，
            * 所以，在点击消息预览后，如果最新的一条消息的接收者不是自己的id就直接触底，具体在gochat()方法内
           */
        //如果滚动触底，隐藏按钮，计数归零  
        if (chatBody.value.scrollTop + chatBody.value.clientHeight >= chatBody.value.scrollHeight - 0.5) {
            roomView.showToBottomButton = false;

            conut++;//累加计数，目的是加入触底后只执行一次触底更新的代码
            // console.log("conut1=", conut, virtualMessage.hasBottomMore);

            if (virtualMessage.hasBottomMore && conut == 1) {
                // console.log("conut=", conut);

                // console.log(`chatBody.value.scrollTop+chatBody.value.clientHeight=${chatBody.value.scrollTop + chatBody.value.clientHeight},chatBody.value.scrollHeight=${chatBody.value.scrollHeight}`);
                let virtualDom = document.getElementById(virtualMessage.list[virtualMessage.size - 1]._id);
                // setTimeout(() => {
                // console.log("virtualDom:", virtualDom);

                // console.log("virtualMessage.list:", virtualMessage.list);

                if (virtualMessage.list.length == virtualMessage.size && virtualDom) {
                    const { _sliceMessage, _startIndex, _endIndex, _hasBottomMore, _hasTopMore } = sliceMessage('bottom', virtualMessage.hasTopMore, virtualMessage.hasBottomMore, message.list, virtualMessage.list.length, virtualMessage.size, virtualMessage.startIndex, virtualMessage.endIndex);

                    virtualMessage.startIndex = _startIndex;
                    virtualMessage.endIndex = _endIndex;
                    virtualMessage.hasBottomMore = _hasBottomMore;
                    virtualMessage.hasTopMore = _hasTopMore;

                    virtualMessage.list = _sliceMessage;
                    virtualMessage.hasBottomMore = false;

                    virtualDom!.scrollIntoView({ block: 'end' });


                } else if (virtualMessage.list.length >= virtualMessage.size * 2 && virtualDom) {
                    const { _sliceMessage, _startIndex, _endIndex, _hasBottomMore, _hasTopMore } = sliceMessage('bottom', virtualMessage.hasTopMore, virtualMessage.hasBottomMore, message.list, virtualMessage.list.length, virtualMessage.size, virtualMessage.startIndex, virtualMessage.endIndex);

                    virtualMessage.startIndex = _startIndex;
                    virtualMessage.endIndex = _endIndex;
                    virtualMessage.hasBottomMore = _hasBottomMore;
                    virtualMessage.hasTopMore = _hasTopMore;

                    let sliceVirtualMessage = virtualMessage.list.slice(virtualMessage.list.length - virtualMessage.size, virtualMessage.list.length)
                    virtualMessage.list = sliceVirtualMessage.concat(_sliceMessage);

                    virtualDom!.scrollIntoView({ block: 'end' });

                    // console.log("virtualMessage.list2:", virtualMessage.list);

                }
                // }, 50)
            }


        } else {
            //如果往下滚动但没触底

            let idsArray: any = [];
            for (let i = 0; i < virtualMessage.list.length; i++) {
                /**
                 * 经过在控制台将各属性的值打印出来，观察对比后发现，
                 * 关键点在om.offsetTop、dom.clientHeight、currentScrollTop、currentClientHeight上，
                 * 如果dom.offsetTop - dom.clientHeight<=currentScrollTop + currentClientHeight，
                 * 说明这些dom为可视范围内的和已经被顶上去的，即都是用户已读的，
                 * 当停止滚动后，将这些id装到数组内,将对应的message为未读的id过滤出来，
                 * 最后将过滤出来的id发送给服务器，服务器操作数据库将这些id更新为已读状态
                 * */
                const dom: any = document.getElementById(virtualMessage.list[i]._id);
                if ((dom.offsetTop - dom.clientHeight) <= (currentScrollTop + currentClientHeight)) {
                    // console.log("所有已读的dom:", dom.id, dom);
                    let isInside = idsArray.includes(dom.id);
                    // console.log('是否存在？', isInside);
                    if (!isInside) {
                        idsArray.push(dom.id);
                    }

                    clearTimeout(isScrolling);
                    isScrolling = setTimeout(async () => {
                        /*
                         * 全部被用户已读的id，但存在数据库里有一部分已经更新了的情况，
                         * 需要将这些已经更新了的id过滤出来，最后将过滤出来的id发送给服务器，
                         * 服务器操作数据库将这些id更新为已读状态
                        */
                        let finalyNotreadIds = virtualMessage.list.filter((item: any, index: number) => {

                            return item.isRead == 0 && item._id == idsArray[index];
                        }).map((item: any) => {
                            return item._id;
                        });
                        // console.log('停止滚动了,全部被用户已读的id', idsArray);
                        finalyNotreadIds = finalyNotreadIds.filter((item: any) => {
                            return item != undefined;
                        })
                        // console.log('停止滚动了,全部被用户已读的id中数据库还没更新的id', finalyNotreadIds);

                        /**
                         * 找到对应的notifyList.notify.isRead，如果isRead为0才更新
                         * 
                        */
                        let notifyIndex = roomView.index;

                        if (finalyNotreadIds.length >= 1 && state.notifyList.frends[notifyIndex].notify.isRead == 0) {
                            let datas: any = await updateMessageByIds(finalyNotreadIds, roomView.isOne2One);
                            // console.log('按id更新状态', datas);
                            if (datas.status == 200) {
                                // await getNotifyList();
                                // console.log('roomView.isOne2One:', roomView.isOne2One);
                                // console.log('roomView.receiverInfo._id:', roomView.receiverInfo._id);
                                // console.log('roomView.groupId:', roomView.groupId);

                                // let id = roomView.isOne2One ? roomView.receiverInfo._id : roomView.groupId;
                                // console.log('id:', roomView.receiverInfo._id, roomView.groupId);

                                await myGetHistory(roomView.receiverInfo._id);
                                // //初始化最终渲染的聊天记录，返回初始化后的要显示的聊天记录和下标
                                const { _virtualMessage, _startIndex, _endIndex } = initViretualMesssage(message.list, 20)
                                virtualMessage.list = _virtualMessage;
                                virtualMessage.startIndex = _startIndex;
                                virtualMessage.endIndex = _endIndex;

                                await getNotifyList();
                            }



                        }
                    }, 10);
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
 * 1.获取滚动节点 let searchListBody: any = ref(null);
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

//添加members的搜索触底加载更多

// 搜索列表加载更多方法


//新建群组
const addMembers: any = reactive({
    members: [],
    searchList: [],
    isShowModal: false,
    searchContent: '',
    searchPage: 1,
    isSeachOnload: false,
    isCreateName: true,
    groupName: '',
})

//点击新建
const onOpeanModal = () => {
    addMembers.isShowModal = true;
}

//下一步
const onNext = () => {
    if (addMembers.groupName != '') {
        addMembers.isCreateName = false;
    }
}

//点击添加
const onAdd = (userInfo: any) => {
    console.log('添加用户：', userInfo);
    let isInside = addMembers.members.some((item: any) => {
        return item._id == userInfo._id;
    })
    console.log(isInside);
    if (!isInside) {
        addMembers.members.push(userInfo);
    }

}


//点击删除member
const onDeleteMember = (member: any) => {
    console.log(member);
    let index = addMembers.members.findIndex((item: any) => {
        return item._id == member._id;
    })
    addMembers.members.splice(index, 1);
}

//关闭
const oncloseCreateGroup = () => {
    addMembers.groupName = '';
    addMembers.searchContent = '';
    addMembers.isCreateName = true;
    addMembers.searchList = [];
    addMembers.members = [];
}



//点击上一步,返回到设置群组名称
const onPrevious = () => {
    addMembers.isCreateName = true;
    addMembers.searchContent = '';
    addMembers.searchList = [];
    addMembers.members = [];
}

//点击创建
const onCreate = async () => {
    let members = addMembers.members.map((item: any) => {
        return item._id;
    });

    //把自己装进去,第一个是群主
    members.unshift(userStore.userInfo._id);

    // console.log("members", members);


    try {
        const datas: any = await createGroup(addMembers.groupName, 0, members);
        console.log('创建群聊', datas);
        if (datas.status == 200) {
            addMembers.isShowModal = false;
            addMembers.groupName = '';
            addMembers.searchContent = '';
            addMembers.isCreateName = true;
            addMembers.searchList = [];
            addMembers.members = [];

            await getNotifyList();
        }

    } catch (err) {
        console.log(err);
    }
}

//新建群组

//监听虚拟列表，如果发生改变，并且roomView.receiverInfo.isOne2One不等于0，
//说明离开了群聊，需要告诉服务器切断soket上的群聊
//每条消息需要单独处理单独分发，所以弃用joinRoom和leaveRoom
watch(
    () => virtualMessage.list,
    (value, oldValue) => {
        let isLeave = roomView.receiverInfo ? 1 : 0;
        if (isLeave) {
            if (roomView.receiverInfo.isOne2One != 0) {
                socket.emit('leave room', groupView.groupId);
            }
        }
    },
    { immediate: true }
)

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
            
            <section class="flex flex-col flex-none overflow-auto w-24 hover:w-64 group lg:max-w-sm md:w-2/5 max-w-xs transition-all duration-300 ease-in-out">
                <div class="header p-4 flex flex-row justify-between items-center flex-none ">
                    <div @click="roomView.close = 1" class="w-10 h-10 relative flex flex-shrink-0 cursor-pointer" style="">
                        <img class="rounded-5 w-full h-full object-cover" alt=""
                             src="../assets/saturn2.ico"/>
                    </div>
                    <p class="text-md font-bold hidden md:block group-hover:block">IOconec</p>
              <!-- 新建群组按钮 -->
                    <label @click="onOpeanModal" htmlFor="my-modal-3"   class="block rounded-full hover:bg-gray-700 bg-gray-800 w-10 h-10 p-2 hidden md:block group-hover:block">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                        </svg>

                       
                    </label>
               <!-- 新建群组按钮 -->
                </div>

                <!-- 搜索框 -->
                <div class="search-box p-4 flex-none">
                    <form onsubmit="">
                        <div class="relative">
                            <label>
                                <input v-model="state.searchContent" @keyup="onSearch(1)" class="rounded-full py-2 pr-6 pl-10 w-full border border-gray-800 focus:border-gray-700 bg-gray-800 focus:bg-gray-900 focus:outline-none text-gray-200 focus:shadow-md transition duration-300 ease-in"
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
                  
                    <div v-for="item, index in state.notifyList.frends" :key="index" @click="goChat(item, 0, index)" class="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg relative">
                         <!-- 单聊头像 -->
                        <div v-if="item.avatar" class="w-16 h-16 relative flex flex-shrink-0">
                            <img class="shadow-md rounded-full w-full h-full object-cover"
                                 :src="item.avatar"
                                 alt=""
                            />
                        </div>
                   <!-- 单聊头像 -->

                   <!-- 群聊头像 -->
                   <div v-else className="avatar placeholder">
                        <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                            <span className="text-3xl">{{ item.name[0] }}</span>
                        </div>
                      
                   </div> 
                   <!-- 群聊头像 -->
                
                <!-- 用户名、最新收到的信息、时间 -->
                        <div class="flex-auto min-w-0 ml-4 mr-6 hidden md:block group-hover:block">
                            <p>{{ item.username ? item.username : item.name }}</p>
                            <div class="flex items-center text-sm text-gray-600">
                                <div class="min-w-0">
                                    <p class="truncate">{{ item.notify.content ? item.notify.content : 'hi' }}</p>
                                </div>
                                <p class="ml-2 whitespace-no-wrap">{{ notifyFormatter(item.notify.updateAt ? item.notify.updateAt : item.createTime) }}</p>
                            </div>
                        </div>
                        <div v-if="userStore.userInfo._id != item.notify.sender && item.notify.notreadCount" class="bg-blue-700 w-6 h-6 rounded-full inline-flex text-center items-center justify-center flex-shrink-0 hidden md:block group-hover:block">{{ item.notify.notreadCount }}</div>
                    </div>
                <!-- 用户名、最新收到的信息、时间 -->
                    
                </div>
                  <!-- 消息预览列表 -->


                  <!-- 搜索用户列表 -->
                <div v-if="state.searchContent != ''" class="contacts p-2 flex-1 overflow-y-scroll" ref="searchListBody" @scroll="loadMoreSearch()">
                    <div v-for="item, index in state.searchList" :key="item" @click="goChat(item, 1, index)" class="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg relative">
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
                        <div v-if="roomView.receiverInfo.isOne2One == 0 ? false : true" class="w-12 h-12 mr-4 relative flex flex-shrink-0">
                            <img class="shadow-md rounded-full w-full h-full object-cover"
                                 :src="roomView.receiverInfo.avatar"
                                 alt=""
                            />
                        </div>
                        <div v-else className="avatar placeholder">
                        <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                            <span className="text-3xl">{{ roomView.receiverInfo.name[0] }}</span>
                        </div>
                   </div> 
                        <div class="text-sm">
                            <p class="font-bold">{{ roomView.receiverInfo.username ? roomView.receiverInfo.username : roomView.receiverInfo.name }}</p>
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
                    
                    <!-- 文本消息 others -->
                    <template v-for="item, index in virtualMessage.list" :key="index">
                        
                     
                        <div :class="userStore.userInfo._id != item.sender ? 'flex flex-row justify-start mt-1' : 'flex justify-start flex-row-reverse mt-3'">
                            <!-- 头像 -->
                            <div  class="flex items-center justify-center h-10 w-10 rounded-full  flex-shrink-0 mr-4 ml-2">
                                <img class="shadow-md rounded-full w-full h-full object-cover"
                                            :src="userStore.userInfo._id != item.sender ? item.userInfo ? item.userInfo.avatar : roomView.receiverInfo.avatar : userStore.userInfo.avatar"
                                            alt="" />
                                            
                            </div>
                            
                        
                            <!-- 头像 -->

                        <!-- 信息内容 -->
                            <div class="messages text-sm text-white grid grid-flow-row gap-2" :id="item._id">
                                <!-- 文本信息 -->
                                <div :class="userStore.userInfo._id != item.sender && item.contentType == 1 ? 'flex items-center group' : 'flex items-center flex-row-reverse group'">
                                    <!-- 用户名和时间 -->
                                    
                                    <p :class="userStore.userInfo._id != item.sender && item.contentType == 1 ? 'px-4 py-2 rounded-t-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md' : 'px-4 py-2 rounded-t-full rounded-l-full bg-blue-700 max-w-xs lg:max-w-md'">
                                        <span :class="userStore.userInfo._id != item.sender && item.contentType == 1 ? 'text-sm text-slate-500' : 'text-sm text-stone-400'">{{ item.userInfo ? item.userInfo.username : roomView.receiverInfo.username }}</span>
                                        <br /> <!-- 添加换行符，使 content 在下一行显示 -->
                                        {{ item.content }}
                                    </p>
                                </div>

                                <!-- 翻译文本 有动效-->
                                <div v-if="(userStore.userInfo._id != item.sender && item.contentType == 1)" class="flex items-center group mb-4 -mt-1">
                                    <p class="px-4 py-2 rounded-b-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200"><TypingText :text="item.translatedContent"></TypingText></p>
                                </div>
                                <!-- 翻译文本 有动效-->

                                <!-- 翻译文本 无动效-->
                                <!-- <div v-if="(userStore.userInfo._id == item.receiver && item.contentType == 1)" class="flex items-center group mb-4 -mt-1">
                                    <p class="px-6 py-3 rounded-b-full rounded-r-full bg-gray-800 max-w-xs lg:max-w-md text-gray-200">translated text here,no animation</p>
                                </div> -->
                                <!-- 翻译文本 无动效-->

                                <!-- 文本信息 -->

                                <!-- 图片信息 -->
                            <div v-if="(userStore.userInfo._id != item.sender && item.contentType == 2)" calss="flex items-center group">
                                        <a class="block w-64 h-64 relative flex flex-shrink-0 max-w-xs lg:max-w-md" href="#">
                                            <img class="absolute shadow-md w-full h-full rounded-r-lg object-cover" :src="roomView.receiverInfo.avatar" alt="hiking"/>
                                        </a>
                                </div>
                                <!-- 图片信息 -->
                            
                            </div>
                            <!-- 信息内容 -->
                        </div>
                   </template>
                    <!--文本消息 others -->

                   

                    <!-- 更新时间 -->
                    <!-- <p class="p-4 text-center text-sm text-gray-500">FRI 3:04 PM</p> -->
                    <!-- 更新时间 -->


                    <!-- 触底按钮和未读计数 -->
                    <div v-if="roomView.showToBottomButton" @click="scrollToBottom()" class="fixed bottom-20 right-8 flex flex-col items-center">
                       <div v-if="roomView.notReadCount"  class="flex justify-center absolute -top-2">{{ roomView.notReadCount }}</div>
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
                        <button @click="onSend" type="button" class="flex flex-shrink-0 focus:outline-none mx-2 block text-blue-600 hover:text-blue-700 w-7 h-7">
                            <svg  viewBox="0 0 16 16" class="w-full h-full fill-current ">
                                <path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/>
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
                        
                   <TypingText text="Hello MothaFuka " ></TypingText>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- 新建群组的modal -->
    <input v-if="addMembers.isShowModal" type="checkbox" id="my-modal-3" className="modal-toggle" />
    <div className="modal">
        <div className="modal-box relative bg-gray-800 border-gray-800 focus:border-gray-700">
            <label @click="oncloseCreateGroup" htmlFor="my-modal-3" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <h3 className="text-lg font-bold">New Group</h3>

            <!-- 设置群组名称 -->
            <div v-if="addMembers.isCreateName" class="set-group-name">
                
                <div class="flex items-center mt-1 border-b-2 border-sky-800  py-2">
                  <input v-model="addMembers.groupName" class="appearance-none bg-transparent border-none w-full  mr-3 py-1 px-2 leading-tight focus:outline-none" type="text" placeholder="Group name" aria-label="Full name">
                </div>
                    <div className="card-actions justify-end mt-2">
                    <button className="btn btn-ghost" @click="onNext">Next</button>
                    </div>
              
             
            </div>
            <!-- 设置群组名称 -->

            <!-- 添加群组用户 -->
            <div v-else class="add-members">
            
            <!-- 头像展示 -->
            <div class="avatars">
                <div class="avatar-group -space-x-6">
                    <div class="relative">
                        <div class="avatar" v-for="item, index in addMembers.members">
    
                            <div class="w-12">
                                <img :src="item.avatar" />
                            </div>
                            
                            <div @click="onDeleteMember(item)" class="absolute flex right-0 top-1 text-white cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-12 h-10">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                             </div>
                             
                        </div>
                       
                    </div>
                </div>

            </div>
            <!-- 头像展示 -->
                <!-- 搜索框 -->
            <div class="search-box p-4 flex-none">
                    <form onsubmit="">
                        <div class="relative">
                            <label>
                                <input v-model="addMembers.searchContent" @keyup="onSearch(0)" class="rounded-full py-2 pr-6 pl-10 w-full border border-gray-800 focus:border-gray-700 bg-gray-800 focus:bg-gray-900 focus:outline-none text-gray-200 focus:shadow-md transition duration-300 ease-in"
                                       type="text"  placeholder="Search User"/>
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

              <!-- 搜索用户列表 -->
              <div class="contacts p-2 flex-1 overflow-y-scroll min-h-0">
                    <div v-for="item, index in addMembers.searchList" :key="item" @click="onAdd(item)" class="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg relative">
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
                    <div class="flex justify-center"><loding :isLoading="addMembers.isSeachOnload"></loding></div>
                    <div className="card-actions justify-end mt-2">
                        <button className="btn btn-ghost" @click="onPrevious">Previous</button>
                        <button className="btn btn-ghost" @click="onCreate">Create</button>
                    </div>
                    
                </div>
                  <!-- 搜索用户列表 -->
            </div>
            <!-- 添加群组用户 -->

        </div>
    </div>
     <!-- 新建群组的modal -->
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