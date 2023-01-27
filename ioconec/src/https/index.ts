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
export const register = (email: string, username: string, password: string) => {
  return instance.post('/register', {
    email, username, password
  },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
};