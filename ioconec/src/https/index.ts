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