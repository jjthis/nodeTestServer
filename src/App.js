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
	const [RoomID, setRoomID] = useState();
	const [Title, setTitle] = useState();
	return (
		<>
			<div style={{ textAlign: 'center', alignItems: 'center' }}>

				{
					RoomID && (
						<div>
							<form onSubmit={() => { setRoomID(); setTitle(); }}>

								<h1>
									<button style={{ marginRight: '20px', padding: '5px' }} type="submit">back</button>
									{Title}
								</h1>
							</form>
						</div>
					)
				}
				<h1>{!RoomID && "Chat"} </h1>
			</div>
			<div className="Tops">
				<div className="App">
					{RoomID ? <ChatView id={RoomID} title={Title} /> :
						<RoomView setRoomID={setRoomID} setTitle={setTitle} />}
				</div>
			</div>
			<div className="blanks" />``
		</>
	)
}

let roomSnap = () => { };
function RoomView(props) {
	const dummy = createRef();
	const [formValue, setFormValue] = useState('');
	const [messages, setMessages] = useState('');

	const chat = firestore.collection("room");
	const query = chat.orderBy('createdAt');

	useEffect(() => {
		query.get().then(doc => {
			setMessages(doc.docs);
		});
		roomSnap();
		roomSnap = query.onSnapshot(doc => {
			setMessages(doc.docs);
		});
	}, [query]);

	const sendMessage = async (e) => {
		e.preventDefault();
		chat.add({
			text: formValue,
			createdAt: firebase.firestore.FieldValue.serverTimestamp()
		});
		setFormValue('');
		window.scroll({
			top: document.body.scrollHeight,
			left: 0,
			behavior: 'smooth',
		});
		// dummy.current.scrollIntoView({ behavior: "smooth" });
	};
	return (<>
		<main>
			{messages &&
				messages.map((msg, idx) =>
					<ChatMessage
						key={msg.id} keys={msg.id}
						message={msg.data()}
						setRoomID={props.setRoomID} setTitle={props.setTitle}
					/>)
			}
		</main>

		<form onSubmit={sendMessage}>
			<input value={formValue} onChange={(e) => setFormValue(e.target.value)}
				placeholder="title" />
			<button type="submit" disabled={!formValue}>make</button>
		</form>
		<div ref={dummy} />
	</>);
}


let snap = () => { };
function ChatView(props) {
	const dummy = createRef();
	const [showCnt, setShowCnt] = useState(5);
	const [formValue, setFormValue] = useState('');
	const [messages, setMessages] = useState('');

	const chat = firestore.collection("room").doc(props.id).collection('chat');
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
						roomID={props.id}
						key={msg.id} keys={msg.id}
						message={msg.data()} />)}
		</main>

		<form onSubmit={sendMessage}>
			<input value={formValue} onChange={(e) => setFormValue(e.target.value)}
				placeholder="input text" />
			<button type="submit" disabled={!formValue}>send</button>
		</form>
		<div ref={dummy} />
	</>);
}

function ChatMessage(props) {
	const { text } = props.message;

	const messageClass = 'received';
	const deleteChat = (id, e) => {
		if (e.button === 1) {
			e.preventDefault();
			if (props.roomID)
				firestore.collection("room").doc(props.roomID).collection('chat').doc(id).delete();
			else
				firestore.collection("room").doc(id).delete();
		} else if (e.button === 0) {
			if (!props.roomID) {
				props.setTitle(text);
				props.setRoomID(id);
			}
		}
	}
	return (<>
		<div className={`${messageClass}`} onMouseDown={(e) => deleteChat(props.keys, e)}  >
			{text}
		</div>
	</>)
}

export default App;