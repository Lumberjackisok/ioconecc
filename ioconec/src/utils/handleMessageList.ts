
/**
 * 当用户打开某个聊天室后，初始化聊天记录切片，
 * 找到切片的起始坐标，
 * 即，从聊天记录的最后一条起，往上数20条聊天记录，
 * 需要判断总长度是否大于20,
 * 如果总长度大于20，返回总长度减20，
 * 否则返回0。
*/
export const firstStartIndex = (arr: any, size: number = 20) => {
  if (arr.length > size) {
    return arr.length - size;
  }
  return 0;
}

/**
 * 根据相应的向上滚动或向下滚动，对startIndex和endIndex进行相应的调整。
 * 参数：message数组,展示的条数默认20
*/


