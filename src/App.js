import React, { createRef, useEffect, useState } from 'react'
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import './App.css';

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

function App() {
	return (
		<>
			 <div style={{textAlign: 'center'}}>
				<h1> Chat </h1>
			</div>
			<div className="Tops">
				<div className="App">
					{<ChatView />}
				</div>
			</div>
			<div className="blanks" />
		</>
	)
}

let snap = () => { };
function ChatView() {
	const dummy = createRef();
	const [showCnt, setShowCnt] = useState(5);
	const [formValue, setFormValue] = useState('');
	const [messages, setMessages] = useState('');

	const chat = firestore.collection("chat");
	const query = chat.orderBy('createdAt').limitToLast(showCnt);
	const addCount = (e) => {
		e.preventDefault();
		setShowCnt(showCnt + 5);
	}

	useEffect(() => {
		query.get().then(doc => {
			setMessages(doc.docs);
		});
		snap();
		snap = query.onSnapshot(doc => {
			setMessages(doc.docs);
		});
	}, [query]);

	const sendMessage = async (e) => {
		e.preventDefault();
		chat.add({
			text: formValue,
			createdAt: firebase.firestore.FieldValue.serverTimestamp()
		});

		setShowCnt(showCnt + 1);
		setFormValue('');
		window.scroll({
			top: document.body.scrollHeight,
			left: 0,
			behavior: 'smooth',
		});
		// dummy.current.scrollIntoView({ behavior: "smooth" });
	};
	return (<>
		<form onSubmit={addCount}>
			<button type="submit">more 5</button>
		</form>
		<main>
			{messages &&
				messages.map((msg, idx) =>
					<ChatMessage
						key={msg.id} keys={msg.id} message={msg.data()} />)}
		</main>

		<form onSubmit={sendMessage}>
			<input value={formValue} onChange={(e) => setFormValue(e.target.value)}
				placeholder="input text" />
			<button type="submit" disabled={!formValue}>send</button>
		</form>
		<div ref={dummy} />
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