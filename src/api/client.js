import axios from 'axios';

const api = axios.create({
  baseURL: "https://api-syncmono.onrender.com/api"
});

export default api;
