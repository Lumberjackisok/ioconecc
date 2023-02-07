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

export const sendMessage = (sender = 'sender', receiver = 'receiver', conten_type = 1, content = 'Ecuador is like a pocket Earth. The cinematic descent from Quito’s chilly, breath-defying altitudes through the rolling clouds of Cuenca, and into Guayaquil’s humid tropical bay is nothing short of surreal, but also an excellent barometer for studying the country’s rich multiculturality.') => {
  return instance.post('/sendMessage', { sender, receiver, conten_type, content },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    }
  )
}