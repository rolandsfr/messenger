import { createSlice } from "@reduxjs/toolkit";

let friendsBarSlice = createSlice({
  name: "friendsBar",
  initialState: {
    activeUser: null,
  },
  reducers: {
    ACTIVATE_USER: (state, action) => {
      state.activeUser = action.payload;
    },
  },
});

export default friendsBarSlice.reducer;
export const { ACTIVATE_USER } = friendsBarSlice.actions;
