import React, { useEffect, useRef, useState } from 'react'
import "firebase/compat/firestore";
import firebase from "firebase/compat/app";
import './App.css';
import styled from "styled-components"

import { useCollection, useCollectionData } from 'react-firebase-hooks/firestore';
firebase.initializeApp({
	apiKey: process.env.REACT_APP_apiKey,
	authDomain: process.env.REACT_APP_authDomain,
	projectId: process.env.REACT_APP_projectId,
	storageBucket: process.env.REACT_APP_storageBucket,
	messagingSenderId: process.env.REACT_APP_messagingSenderId,
	appId: process.env.REACT_APP_appId,
	measurementId: process.env.REACT_APP_measurementId
});
const firestore = firebase.firestore();

const TopDiv = styled.div`
	background-color: black;
`;

function App() {

	return (
		<TopDiv>
			<div className="App">


				{<ChatView />}
			</div>
		</TopDiv>
	)
}
let showCnt = 25;

function ChatView() {
	const dummy = useRef();

	console.log(showCnt);

	const chat = firestore.collection("chat");
	const query = chat.orderBy('createdAt').limitToLast(showCnt);
	const [snap] = useCollection(query, { idField: 'id' });
	const [messages] = useCollectionData(query, { idField: 'id' });
	const [formValue, setFormValue] = useState('');

	const sendMessage = (e) => {
		e.preventDefault();


		chat.add({
			text: formValue,
			createdAt: firebase.firestore.FieldValue.serverTimestamp()
		})

		setFormValue('');
		dummy.current.scrollIntoView({ behavior: 'smooth' });
	};
	return (<>

		<main>

			{messages && messages.map((msg, idx) => <ChatMessage key={snap.docs[idx].id} keys={snap.docs[idx].id} message={msg} />)}

			<span ref={dummy}></span>

		</main>

		<form onSubmit={sendMessage}>

			<input value={formValue} onChange={(e) => setFormValue(e.target.value)}
				placeholder="input text" />

			<button type="submit" disabled={!formValue}>send</button>

		</form>
	</>)
}

function ChatMessage(props) {
	const { text } = props.message;

	const messageClass = 'received';
	const deleteChat = (id, e) => {
		if (e.button === 1) {
			e.preventDefault();
			firestore.collection("chat").doc(id).delete();
		}
	}
	return (<>
		<div className={`message ${messageClass}`} onMouseDown={(e) => deleteChat(props.keys, e)}  >
			<p>{text}</p>
		</div>
	</>)
}


export default App;