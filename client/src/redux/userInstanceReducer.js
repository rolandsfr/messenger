import { createSlice } from "@reduxjs/toolkit";
import firebase from "../firebase";
import "firebase/auth";

const auth = firebase.auth();

const userSlice = createSlice({
  name: "userInstance",
  initialState: {
    dms: [],
  },
  reducers: {
    CREATE_NEW_DM: (state, action) => {
      state.dms = [
        ...state.dms,
        {
          email: action.payload.email,
          name: action.payload.name,
          //  Currently isnt fetched
          lastMessage: "Tap here to start the conversation",
          time: Date.now(),
          uid: action.payload.uid,
          typing: false,
          color: action.payload.color,
        },
      ];
    },
    RETURN_DMS: (state, action) => {
      state.dms = action.payload;
    },
    UPDATE_UNREAD: (state, action) => {
      let { unread, uid } = action.payload;
      let arr = [];

      for (let i = 0; i < state.dms.length; i++) {
        if (state.dms[i].uid === uid) {
          let current = state.dms[i];
          current.unread = unread;
          arr.push(current);
        } else {
          arr.push(state.dms[i]);
        }
      }

      state.dms = arr;
    },
    UPDATE_LATEST_MESSAGE: (state, { payload }) => {
      let { uid, msg } = payload;

      let arr = [];

      for (let i = 0; i < state.dms.length; i++) {
        if (state.dms[i].uid === uid) {
          let current = state.dms[i];
          current.lastMessage = msg;
          arr.push(current);
        } else {
          arr.push(state.dms[i]);
        }
      }

      state.dms = arr;
    },
    UPDATE_TYPING: (state, { payload }) => {
      let { uid, typingState } = payload;

      let arr = [];

      for (let i = 0; i < state.dms.length; i++) {
        if (state.dms[i].uid === uid) {
          let current = state.dms[i];
          current.typing = typingState;
          arr.push(current);
        } else {
          arr.push(state.dms[i]);
        }
      }

      state.dms = arr;
    },
  },
});

export default userSlice.reducer;
export const {
  CREATE_NEW_DM,
  RETURN_DMS,
  UPDATE_UNREAD,
  UPDATE_LATEST_MESSAGE,
  UPDATE_TYPING,
} = userSlice.actions;
