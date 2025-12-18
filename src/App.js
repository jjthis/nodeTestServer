import React, { useEffect, useState, useRef, useCallback } from 'react'
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

// 랜덤 색상 생성 (sender별로 고유 색상)
const getColorFromName = (name) => {
	const colors = [
		'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
		'#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
		'#F8B500', '#FF8C00', '#00CED1', '#FF69B4', '#32CD32'
	];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors.length];
};

function App() {
	const [RoomID, setRoomID] = useState();
	const [Title, setTitle] = useState();
	const [userName, setUserName] = useState(() => {
		return localStorage.getItem('chatUserName') || '';
	});
	const [isEditingName, setIsEditingName] = useState(false);
	const [tempName, setTempName] = useState('');

	const handleSetName = (e) => {
		e.preventDefault();
		if (tempName.trim()) {
			setUserName(tempName.trim());
			localStorage.setItem('chatUserName', tempName.trim());
			setIsEditingName(false);
		}
	};

	// 이름이 없으면 이름 입력 화면 표시
	if (!userName) {
		return (
			<div className="chat-container">
				<div className="name-setup">
					<div className="name-setup-icon">👋</div>
					<h2 className="name-setup-title">환영합니다!</h2>
					<p className="name-setup-subtitle">채팅에서 사용할 이름을 입력해주세요</p>
					<form className="name-setup-form" onSubmit={handleSetName}>
						<input
							className="name-input"
							value={tempName}
							onChange={(e) => setTempName(e.target.value)}
							placeholder="이름 입력..."
							autoFocus
							maxLength={20}
						/>
						<button
							className="name-submit-btn"
							type="submit"
							disabled={!tempName.trim()}
						>
							시작하기
						</button>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div className="chat-container">
			{/* 헤더 */}
			<div className="chat-header">
				{RoomID ? (
					<>
						<button
							className="back-btn"
							onClick={() => { setRoomID(); setTitle(); }}
							title="뒤로가기"
						>
							←
						</button>
						<span className="room-title">{Title}</span>
					</>
				) : (
					<>
						<div className="chat-header-icon">💬</div>
						<h1>Chat</h1>
					</>
				)}
				{/* 사용자 프로필 */}
				<div className="user-profile" onClick={() => { setTempName(userName); setIsEditingName(true); }}>
					<div
						className="user-avatar"
						style={{ backgroundColor: getColorFromName(userName) }}
					>
						{userName.charAt(0).toUpperCase()}
					</div>
					<span className="user-name">{userName}</span>
				</div>
			</div>

			{/* 이름 수정 모달 */}
			{isEditingName && (
				<div className="modal-overlay" onClick={() => setIsEditingName(false)}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h3 className="modal-title">이름 변경</h3>
						<form onSubmit={handleSetName}>
							<input
								className="name-input"
								value={tempName}
								onChange={(e) => setTempName(e.target.value)}
								placeholder="새 이름 입력..."
								autoFocus
								maxLength={20}
							/>
							<div className="modal-buttons">
								<button
									type="button"
									className="modal-cancel-btn"
									onClick={() => setIsEditingName(false)}
								>
									취소
								</button>
								<button
									type="submit"
									className="modal-submit-btn"
									disabled={!tempName.trim()}
								>
									저장
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* 메인 콘텐츠 */}
			{RoomID ? (
				<ChatView id={RoomID} title={Title} userName={userName} />
			) : (
				<RoomView setRoomID={setRoomID} setTitle={setTitle} />
			)}
		</div>
	);
}


function RoomView(props) {
	const messagesContainerRef = useRef(null);
	const [formValue, setFormValue] = useState('');
	const [messages, setMessages] = useState([]);

	const chat = firestore.collection("room");
	const query = chat.orderBy('createdAt');

	// 스크롤이 맨 아래인지 확인
	const isScrolledToBottom = useCallback(() => {
		const threshold = 100;
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight;
		const clientHeight = window.innerHeight;
		return scrollHeight - scrollTop - clientHeight < threshold;
	}, []);

	// 맨 아래로 스크롤
	const scrollToBottom = useCallback(() => {
		window.scroll({
			top: document.body.scrollHeight,
			left: 0,
			behavior: 'smooth',
		});
	}, []);

	useEffect(() => {
		const snap = query.onSnapshot(doc => {
			console.log("1. snap 호출");
			const wasAtBottom = isScrolledToBottom();
			setMessages(doc.docs);
			if (wasAtBottom) {
				setTimeout(scrollToBottom, 50);
			}
		});
		return () => {
			snap();
		};
	}, []);

	const sendMessage = async (e) => {
		e.preventDefault();
		if (!formValue.trim()) return;

		chat.add({
			text: formValue,
			createdAt: firebase.firestore.FieldValue.serverTimestamp()
		});
		setFormValue('');
		setTimeout(scrollToBottom, 100);
	};

	return (
		<>
			<div className="messages-container" ref={messagesContainerRef}>
				{messages && messages.length > 0 ? (
					messages.map((msg) => (
						<RoomItem
							key={msg.id}
							keys={msg.id}
							message={msg.data()}
							setRoomID={props.setRoomID}
							setTitle={props.setTitle}
						/>
					))
				) : (
					<div className="empty-state">
						<div className="empty-icon">🏠</div>
						<div className="empty-title">채팅방이 없습니다</div>
						<div className="empty-subtitle">새로운 채팅방을 만들어보세요!</div>
					</div>
				)}
			</div>

			<div className="input-container">
				<form className="input-form" onSubmit={sendMessage}>
					<input
						className="message-input"
						value={formValue}
						onChange={(e) => setFormValue(e.target.value)}
						placeholder="새 채팅방 이름 입력..."
					/>
					<button
						className="send-btn"
						type="submit"
						disabled={!formValue.trim()}
						title="채팅방 만들기"
					>
						+
					</button>
				</form>
			</div>
		</>
	);
}

function RoomItem(props) {
	const { text } = props.message;

	const handleClick = (id, e) => {
		if (e.button === 1) {
			e.preventDefault();
			firestore.collection("room").doc(id).delete();
		} else if (e.button === 0) {
			props.setTitle(text);
			props.setRoomID(id);
		}
	};

	return (
		<div
			className="message-item"
			onMouseDown={(e) => handleClick(props.keys, e)}
		>
			<div className="room-item">
				<div className="room-icon">💬</div>
				<div className="room-info">
					<div className="room-name">{text}</div>
					<div className="room-preview">클릭하여 입장</div>
				</div>
				<div className="room-arrow">→</div>
			</div>
		</div>
	);
}

function ChatView(props) {
	const messagesContainerRef = useRef(null);
	const [showCnt, setShowCnt] = useState(20);
	const [formValue, setFormValue] = useState('');
	const [messages, setMessages] = useState([]);

	const chat = firestore.collection("room").doc(props.id).collection('chat');
	const query = chat.orderBy('createdAt').limitToLast(showCnt);

	// 스크롤이 맨 아래인지 확인
	const isScrolledToBottom = useCallback(() => {
		const threshold = 100;
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight;
		const clientHeight = window.innerHeight;
		return scrollHeight - scrollTop - clientHeight < threshold;
	}, []);

	// 맨 아래로 스크롤
	const scrollToBottom = useCallback(() => {
		window.scroll({
			top: document.body.scrollHeight,
			left: 0,
			behavior: 'smooth',
		});
	}, []);

	const addCount = (e) => {
		e.preventDefault();
		setShowCnt(showCnt + 10);
		query.get().then(doc => {
			setMessages(doc.docs);
		});
	};

	useEffect(() => {
		const snap = query.onSnapshot(doc => {
			console.log("snap 호출");
			const wasAtBottom = isScrolledToBottom();
			setMessages(doc.docs);
			if (wasAtBottom) {
				setTimeout(scrollToBottom, 50);
			}
		});
		return () => {
			snap();
		};
	}, [showCnt]);

	const sendMessage = async (e) => {
		e.preventDefault();
		if (!formValue.trim()) return;

		chat.add({
			text: formValue,
			sender: props.userName,
			createdAt: firebase.firestore.FieldValue.serverTimestamp()
		});

		// setShowCnt(showCnt + 1);
		setFormValue('');
		setTimeout(scrollToBottom, 100);
	};

	return (
		<>
			<div className="messages-container" ref={messagesContainerRef}>
				<button className="load-more-btn" onClick={addCount}>
					<span>↑</span> 이전 메시지 더보기
				</button>

				{messages && messages.length > 0 ? (
					messages.map((msg) => (
						<ChatMessage
							roomID={props.id}
							key={msg.id}
							keys={msg.id}
							message={msg.data()}
							currentUser={props.userName}
						/>
					))
				) : (
					<div className="empty-state">
						<div className="empty-icon">💭</div>
						<div className="empty-title">메시지가 없습니다</div>
						<div className="empty-subtitle">첫 번째 메시지를 보내보세요!</div>
					</div>
				)}
			</div>

			<div className="input-container">
				<form className="input-form" onSubmit={sendMessage}>
					<input
						className="message-input"
						value={formValue}
						onChange={(e) => setFormValue(e.target.value)}
						placeholder="메시지를 입력하세요..."
					/>
					<button
						className="send-btn"
						type="submit"
						disabled={!formValue.trim()}
						title="메시지 보내기"
					>
						↑
					</button>
				</form>
			</div>
		</>
	);
}

function ChatMessage(props) {
	const { text, sender } = props.message;
	const isOwn = sender === props.currentUser;

	const deleteChat = (id, e) => {
		if (e.button === 1) {
			e.preventDefault();
			firestore.collection("room").doc(props.roomID).collection('chat').doc(id).delete();
		}
	};

	return (
		<div
			className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
			onMouseDown={(e) => deleteChat(props.keys, e)}
		>
			{!isOwn && sender && (
				<div className="bubble-sender">
					<div
						className="sender-avatar"
						style={{ backgroundColor: getColorFromName(sender || 'Unknown') }}
					>
						{(sender || '?').charAt(0).toUpperCase()}
					</div>
					<span className="sender-name">{sender || '익명'}</span>
				</div>
			)}
			<div className={`bubble-content ${isOwn ? 'own' : 'other'}`}>
				<div className="bubble-text">{text}</div>
			</div>
		</div>
	);
}

export default App;
