# messenger
Firebase messenger app built with React, Redux and websockets

## Firebase side of things
The backend of the application was mainly handled by Google Firebase SDK and used it's features like:
  - **storage**
  - **auth**
  - **firestore** database
  - **firebase functions**
  
## Web sockets
As for realtime data streaming, I used technology called Websockets that are handled on the nodejs express server deployed on heroku.
Web sockets allow to implement things such as:
  - "User is typing" indication
  - Showing unread messages
  - Showing messages in real time
  - Joining and leaving "rooms"  

## Redux side of things
Redux was my go-to when I realized I needed to persist data between different pages/screens.  
For the asynchrounous action creators I used Redux-Saga which uses generator functions.

## License
[MIT](https://choosealicense.com/licenses/mit/)
