import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API,
  withCredentials: true
});

let accessToken = null;
export function setAccessToken(token) { accessToken = token; }
export function getAccessToken() { return accessToken; }

api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(res => res, async (err) => {
  const original = err.config;
  if (err.response?.status === 401 && !original._retry) {
    original._retry = true;
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API}/auth/refresh`, {}, { withCredentials: true });
      // setAccessToken(data.accessToken);
      // original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(original);
    } catch (e) {}
  }
  return Promise.reject(err);
});

export default api;
