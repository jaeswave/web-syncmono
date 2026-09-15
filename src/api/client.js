import axios from 'axios';

const api = axios.create({
  baseURL: "api-syncmono.onrender.com/api",
});

export default api;
