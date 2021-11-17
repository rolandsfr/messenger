import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import userReducer from "./userReducer";
import friendsReducer from "./friendsReducer";
import userInstanceReducer from "./userInstanceReducer";
import { compose } from "react-redux";
import createSagaMiddleware from "redux-saga";
import friendsBarReducer from "./FriendsBarReducer";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    user: userReducer,
    friends: friendsReducer,
    userInstance: userInstanceReducer,
    friendsBar: friendsBarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

export default store;
export { sagaMiddleware };
