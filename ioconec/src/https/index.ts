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

export const search = (username: string) => {
  return instance.get('/search', {
    params: {
      username
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