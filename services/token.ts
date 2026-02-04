// import * as SecureStore from "expo-secure-store";

// export async function setToken(tokenkey:string, token: string) {
//   await SecureStore.setItemAsync(tokenkey, token);
// }

// export async function getToken(tokenkey:string) {
//   return await SecureStore.getItemAsync(tokenkey);
// }

// export async function deleteToken(tokenkey:string) {
//   await SecureStore.deleteItemAsync(tokenkey);
// }
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";

export const tokenService = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN),

  setTokens: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN, refresh);
  },

  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN);
  },
};
