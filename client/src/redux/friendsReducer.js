import { createSlice } from "@reduxjs/toolkit";

const friendsSlice = createSlice({
  name: "friends",
  initialState: {
    friends: [],
  },
  reducers: {
    FRIENDS_LIST_FETCHED: (state, action) => {
      state.friends = action.payload;
    },
  },
});

export default friendsSlice.reducer;
export const { FRIENDS_LIST_FETCHED } = friendsSlice.actions;
