export const updateNotify = (arr: Array<any>, obj: any) => {
  arr.forEach((item: any, index: number) => {
    if (item.notify._id == obj._id) {
      return index;
    }
    return -1;
  })
}