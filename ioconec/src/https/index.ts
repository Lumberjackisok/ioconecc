import instance from "./requests";

export const login = (email: any, password: any) => {
  return instance.post('/login', {
    email, password
  },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
};

export const register = (email: string, username: string, password: string, language: string) => {
  return instance.post('/register', {
    email, username, password, language
  },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
};

export const search = (username: string, page = 1, limit = 10) => {
  return instance.get('/search', {
    params: {
      username, page, limit
    },
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    }
  }
  )
};

/**
 * sender:发送者uid
 * receiver:接收者uid
 * content_type:1:文本，2:图片，3:语音，4:视频，5:文件
 * 
*/
export const sendMessage = (sender: string, receiver: string, contentType: number, content: string) => {
  return instance.post('/sendMessage', { sender, receiver, contentType, content },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
}

/**
 * 获取聊天历史记录
 * /mssageHistory
 * get
 * sender string
 * receiver:string
*/
export const getHistory = (receiver: string) => {
  return instance.get('/mssageHistory', {
    params: { receiver },
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    }
  });
};

/**
 * 获取消息预览列表
 * /notifyList
 * get
*/
export const notifyList = () => {
  return instance.get('/notifyList', {
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    }
  })
};

/**
 * 创建聊天室，如果为单聊聊天室，聊天室名称默认为对应两个用户的id的字符串相拼接
 * post
 * /createGroup
 * 
 * name:string 群聊名称
 * isOne2One:number 是否为单聊聊天室，1：单聊聊天室，0：群聊聊天室
*/
export const createGroup = (name: string, isOne2One: number, members: Array<any> = []) => {
  return instance.post('/createGroup', {
    name,
    isOne2One,
    members
  },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }

  )
};

/**
 * 更新已读状态
 * /updateMessageStatus
 * post
 * receiver:string
*/
export const updateMessageStatus = (receiver: string) => {
  return instance.post('/updateMessageStatus', { receiver },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
}

/**
 * updateMessageByIds
 * /updateMessageByIds
 * post
 * ids:string[]
*/
export const updateMessageByIds = (ids: string[], isOne2One: number = 1) => {
  return instance.post('/updateMessageByIds', { ids, isOne2One },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
}