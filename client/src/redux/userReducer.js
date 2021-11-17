import { createSlice } from "@reduxjs/toolkit";

const userReducerSlice = createSlice({
  name: "user",
  initialState: {
    isLoggedIn: false,
  },
  reducers: {
    login: (state) => {
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.isLoggedIn = false;
    },
  },
});

export default userReducerSlice.reducer;
export const { login, logout } = userReducerSlice.actions;
