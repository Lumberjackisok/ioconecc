
/**
 * 当用户打开某个聊天室后，初始化聊天记录切片，
 * 找到切片的起始坐标，
 * 即，从聊天记录的最后一条起，往上数20条聊天记录，
 * 需要判断总长度是否大于20,
 * 如果总长度大于20，返回总长度减20，
 * 否则返回0。
*/
export const initViretualMesssage = (message: any, size: number = 20) => {

  if (size >= message.length) {
    return {
      _virtualMessage: message,
      _startIndex: 0,
      _endIndex: message.length
    };
  }
  return {
    _virtualMessage: message.slice(-size),
    _startIndex: message.length - size,
    _endIndex: message.length
  };
}

/*
形参：
isTopOrBottom: string 向上还是向下if('top'){...}else if('bottom'){...}
message: any  原始聊天记录列表
size: number  要截取的条数
startIndex: number  初始化过的开始坐标
endIndex: number  初始化过的结束坐标
hasTopMore:boolean  向上是否还有更多
hasBottomMore:boolean  向下是否还有更多
*/



export const sliceMessage: any = (isTopOrBottom: string, hasTopMore: boolean, hasBottomMore: boolean, message: any, virtualMessageLength: number, size: number = 20, startIndex: number, endIndex: number) => {

  if (isTopOrBottom == 'top' && hasTopMore) {

    /*
     *如果向上触顶了，
     *先通过virtualMessage[size-1]._id获取到对应的dom，
     *然后判断virtualMessage的长度是否为20，
     *如果为真，
     *将startIndex和endIndex向前移动20，
     *endIdnex=startIndex,startIndex-=size,
     *如果startIndex<=0,startIndex=0,hasTopMore=false,
     *再用移动后的startIndex和endIndex去message截取一段数组，
     *再将截取到的数组追加到virtualMessage的前面：virtualMessage=[...sliceMessage,...virtualMessage],
     *如果virtualMessage的长度>=40,
     *只截取virtualMessage前20条：
     *let sliceVirtualMessage=virtualMessage.slice(20,virtualMessage.length),
     *virtualMessage=[...sliceMessage,...sliceVirtualMessage],
     *返回：sliceMessage，_startIndex，_endIndex,_hasMore，对应的变量接收更新，
     *再使用dom.scrollIntoView()方法，没有过渡效果地滚动到触顶时virtualMessage内第一个dom，目的是使其具有连贯性。
     */

    if (virtualMessageLength >= size) {
      let tempIndex = 0;
      tempIndex = startIndex;
      endIndex = tempIndex;//这里是需要截取的坐标
      startIndex = startIndex - size;
      hasBottomMore = true;

      if (startIndex <= 0) {
        startIndex = 0;
        hasTopMore = false;

      }

      let sliceMessage: any = message.slice(startIndex, endIndex);


      return {
        _sliceMessage: sliceMessage,
        _startIndex: startIndex,

        //将之前多减去的size加回去，使其归位，变为在渲染的整个virtualMessage的坐标返回出去
        _endIndex: endIndex + size,
        _hasTopMore: hasTopMore,
        _hasBottomMore: hasBottomMore
      }
    }
  } else if (isTopOrBottom == 'bottom' && hasBottomMore) {

    /*
    如果是向下触底，
    先通过virtualMessage[virtualMessage.length-size-1]._id获取到对应的dom，
    然后判断virtualMessage的长度是否为20,
    如果为真，
    说明到底了，hasBottomMore=false，
    
    如果virtualMessage的长度>=40,
    endIndex和startIndex向后移动20，
    如果endIndex>=message.lenght,
    endIndex=message.lenght,startIndex=virtualMessage.lenght-20,
    再用移动后的startIndex和endIndex去message截取一段数组，
    再将截取到的数组追加到virtualMessage的后面：virtualMessage.concat(sliceMessage),
    
    只截取virtualMessage后20条：
    let sliceVirtualMessage=virtualMessage.slice(virtualMessage.length-20,virtualMessage.length),
    virtualMessage=sliceVirtualMessage.concat(sliceMessage)
    
    */
    if (virtualMessageLength >= size) {
      let tempIndex = 0;
      tempIndex = endIndex;
      startIndex = tempIndex;//这里是需要截取的坐标

      endIndex = endIndex + (size * 2);

      console.log('在方法里面1：', startIndex, endIndex, hasBottomMore);
      if (endIndex + size >= message.length) {
        startIndex = message.length - size;
        endIndex = message.length;
        hasBottomMore = false;
      }

      console.log('在方法里面2：', startIndex, endIndex, hasBottomMore);

      let sliceMessage2: any = message.slice(startIndex, endIndex);
      console.log('在方法里面sliceMessage2：', sliceMessage2);
      let _startIndex = startIndex == message.length - size ? startIndex + size : startIndex;
      return {
        _sliceMessage: sliceMessage2,

        //同上，使其归位，变为在渲染的整个virtualMessage的坐标返回出去
        _startIndex: _startIndex - size,
        _endIndex: endIndex,
        _hasBottomMore: hasBottomMore,
        _hasTopMore: hasTopMore
      }

    }
  }

}

/**
 * 根据相应的向上滚动或向下滚动，对startIndex和endIndex进行相应的调整。
 * 参数：isTopOrBottom向上触顶还是向下触底，message数组,展示的条数默认20，stratIndex,endIndex。
 * 返回三个值：startIndex,endIndex,hasMore。
*/
export const handleMessage = (isTopOrBottom: string, message: any, size: number = 20, startIndex: number, endIndex: number) => {
  /**
   * 如果向上滚动触顶了，则endIndex=startIndex + 1,startIndex=startIndex - size,
   * 如果startIndex - size <= 0，说明已经没有更多了,则startIndex = 0,endIndex = 20
  */
  let upMessage = [];//向前unshift的数组
  let tailMessage = [];
  if (isTopOrBottom == 'top') {
    if (startIndex - size <= 0) {
      startIndex = 0;
      endIndex = size;
      upMessage = message.slice(startIndex, endIndex).reverse();
      return {
        startIndex: startIndex,
        endIndex: endIndex,
        hasMore: false,
        //经过反转后的，用于往上追加的聊天记录，在滚动触顶后遍历该数组，virtualMessage.list使用unshift方法追加
        upMessage: upMessage
      }
    } else {
      let tempIndex = startIndex + 1;
      endIndex = tempIndex;
      startIndex = startIndex - size;
      upMessage = message.slice(startIndex, endIndex).reverse();
      return {
        startIndex: startIndex,
        endIndex: endIndex,
        hasMore: true,
        //同上，用于往上追加的聊天记录，在滚动触顶后遍历该数组，virtualMessage.list使用unshift方法追加
        upMessage: upMessage
      }
    }
  } else if (isTopOrBottom == 'bottom') {
    /**
     * 如果是向下滚动触底，则startIndex=endIndex-1,endIndex=endIndex + size,
     * 如果endIndex+size>=message.length,endIndex=message.length,startIndex=message.length-size。
    */
    if (endIndex + size >= message.length) {
      endIndex = message.length;
      startIndex = message.length - size;
      tailMessage = message.slice(startIndex, endIndex);
      return {
        startIndex: startIndex,
        endIndex: endIndex,
        hasMore: false,
        //tailMessage:用于往下追加的聊天记录，向下滚动触底后，virtualMessage.list使用concat()方法合并数组
        tailMessage: tailMessage
      }
    }

    let tempIndex = endIndex - 1;
    startIndex = tempIndex;
    endIndex = endIndex + size;
    tailMessage = message.slice(startIndex, endIndex);
    return {
      startIndex: startIndex,
      endIndex: endIndex,
      hasMore: true,
      tailMessage: tailMessage//同上
    }
  }
}








