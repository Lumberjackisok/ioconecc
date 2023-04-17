
/**
 * 当用户打开某个聊天室后，初始化聊天记录切片，
 * 找到切片的起始坐标，
 * 即，从聊天记录的最后一条起，往上数20条聊天记录，
 * 需要判断总长度是否大于20,
 * 如果总长度大于20，返回总长度减20，
 * 否则返回0。
*/

/**
 * 补充：
 * 初始化聊天记录切片需要考虑未读消息的条数，
 * 如果未读消息大于40条，startIndex需要定位到第一条未读消息,
 * 相应的，endIndex=startIndex+20。
*/
export const initViretualMesssage = (message: any, size: number = 20) => {
  let notReadCount: number = message.filter((item: any) => {
    return item.isRead == 0;
  }).length;

  console.log("notReadCount", notReadCount);

  if (size >= message.length) {
    return {
      _virtualMessage: message,
      _startIndex: 0,
      _endIndex: message.length
    };
  } else if (notReadCount > size) {
    return {
      _virtualMessage: message.slice(message.length - (message.length - notReadCount) + size),
      _startIndex: message.length - notReadCount,
      _endIndex: (message.length - notReadCount) + size
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

返回：
sliceMessage:any  在原始message那里截取的message
hasTopMore:boolean  向上是否还有更多
hasBottomMore:boolean  向下是否还有更多
startIndex: number  当前渲染在页面上的virtalMessage的startIndex
endIndex: number  前渲染在页面上的virtalMessage的endIndex

除sliceMessage外，其它所有返回的值都需要用对应的变量接收更新，作为下一次的实参再次传入sliceMessage()方法。
*/



export const sliceMessage: any = (isTopOrBottom: string, hasTopMore: boolean, hasBottomMore: boolean, message: any, virtualMessageLength: number, size: number = 20, startIndex: number, endIndex: number) => {

  if (isTopOrBottom == 'top' && hasTopMore) {

    /*
  如果向上触顶了：
  
  在触顶事件内：
  1.调用sliceMessage()方法，并将sliceMessage()返回的数据接收，
  2.通过virtualMessage[size-1]._id获取到对应的dom，
  然后判断virtualMessage的长度是否为>=20且<size*2，
  如果为真，
  将sliceMessage()返回的_sliceMessage合并到当前virtualMessage的前面，
  最后使用dom.scrollIntoView()方法，没有过渡效果地滚动到触顶时virtualMessage内第一个dom，目的是使其具有连贯性。
  如果virtualMessage的长度>=size*2,
  只保留当前virtualMessage前20条，
  因为页面上消息的条数只能最多40条，
  代码：
  let sliceVirtualMessage=virtualMessage.slice(0, size);
  virtualMessage=[...sliceMessage,...sliceVirtualMessage];
  dom.scrollIntoView();
  
  在sliceMessage()方法内：
  将startIndex和endIndex向前移动20，
  endIdnex=startIndex,startIndex-=size,
  如果startIndex<=0,startIndex=0,hasTopMore=false,
  再用移动后的startIndex和endIndex去message截取一段数组，
  最后返回的startIndex和endIndex为最终渲染的整个virtualMessage的坐标，
  所以需要对其做处理，不然返回的是sliceMessage的下标，
  
  具体代码如下：
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
向下触底和向上触顶的逻辑基本相同，
不同的是坐标归位需要减，
dom获取的下标为virtualMessage.size - 1：virtualMessage[virtualMessage.size - 1]._id，
并且为了使节点重新更新渲染后看起来连贯，需要使用{ block: 'end' }参数：
virtualDom!.scrollIntoView({ block: 'end' })

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










