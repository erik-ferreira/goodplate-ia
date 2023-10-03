import axios from "axios"

export const api = axios.create({
  baseURL: "https://api.clarifai.com",
  headers: {
    Authorization: "Key b82f5d7954684e3f8ac0ff52ba758d07",
  },
})
