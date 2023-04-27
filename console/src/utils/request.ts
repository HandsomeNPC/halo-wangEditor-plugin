import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// service.interceptors.request.use((config) => {
//   return config
// })
//
// service.interceptors.response.use((res) => {
//   return res.data
// }, (err) => {
//   console.log(err);
// })

export default service
