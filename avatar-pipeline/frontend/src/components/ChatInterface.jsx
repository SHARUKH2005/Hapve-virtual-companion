import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const ChatContainer = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 350px;
  height: 450px;
  background: rgba(15, 15, 25, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ChatHeader = styled.div`
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: bold;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  box-shadow: 0 0 10px #4caf50;
`;

const MessageList = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

const Message = styled.div`
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
  ${props => props.isUser ? `
    align-self: flex-end;
    background: #3f51b5;
    color: white;
    border-bottom-right-radius: 2px;
  ` : `
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    border-bottom-left-radius: 2px;
  `}
`;

const InputArea = styled.form`
  padding: 15px;
  display: flex;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
`;

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
  color: white;
  outline: none;

  &:focus {
    border-color: #3f51b5;
  }
`;

const SendButton = styled.button`
  background: #3f51b5;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #303f9f;
  }

  &:disabled {
    background: #2c2c2c;
    cursor: not-allowed;
  }
`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! My memory is active. I will remember our conversations and evolve as we talk.", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [stats, setStats] = useState({ level: 1, experience: 0, traits: {} });
  const scrollRef = useRef();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/avatar/stats');
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch stats");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const pollVideo = async (videoId) => {
    setIsVideoLoading(true);
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/avatar/video/${videoId}`);
        if (res.data.status === 'completed' || res.data.status === 'success') {
          setVideoUrl(res.data.video_url);
          setIsVideoLoading(false);
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setIsVideoLoading(false);
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling error:", e);
        clearInterval(interval);
      }
    }, 3000);
  };

  const handleSend = async (e, talkMode = false) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setLoading(true);

    try {
      // 1. Get Brain response from GPT4Free (Now with Memory context)
      const brainRes = await axios.post('/chat', { prompt: userMsg, max_tokens: 150 });
      const responseText = brainRes.data.response;
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);

      // Refresh stats to see evolution
      fetchStats();

      // 2. If Talk Mode is on, get HeyGen Video
      if (talkMode) {
        // For this demo, we'll use a placeholder image if the user hasn't uploaded one yet
        const imageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"; // Placeholder
        const videoRes = await axios.post('/avatar/talk', {
          image_url: imageUrl,
          text: responseText
        });
        if (videoRes.data.video_id) {
          pollVideo(videoRes.data.video_id);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { text: "Connection error. Please try again.", isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusDot />
            AI Companion
          </div>
          <div style={{ fontSize: '0.65rem', color: '#4caf50' }}>
            Lvl {stats.level} | {stats.experience}% to next evolution
          </div>
        </div>
        <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
          <div style={{ width: `${stats.experience}%`, height: '100%', background: '#4caf50', borderRadius: '2px' }}></div>
        </div>
      </ChatHeader>

      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '5px', background: 'rgba(255,255,255,0.02)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
        <span>Friend: {stats.traits?.friendliness?.toFixed(2)}</span>
        <span>Intellect: {stats.traits?.intellect?.toFixed(2)}</span>
        <span>Humor: {stats.traits?.humor?.toFixed(2)}</span>
      </div>
      <MessageList ref={scrollRef}>
        {messages.map((msg, i) => (
          <Message key={i} isUser={msg.isUser}>
            {msg.text}
          </Message>
        ))}
        {loading && <Message isUser={false}>...</Message>}
      </MessageList>
      <InputArea onSubmit={(e) => handleSend(e)}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <div style={{ display: 'flex', gap: '5px' }}>
          <SendButton type="submit" disabled={loading}>Text</SendButton>
          <SendButton
            type="button"
            onClick={(e) => handleSend(null, true)}
            disabled={loading}
            style={{ background: '#f44336' }}
          >
            Talk
          </SendButton>
        </div>
      </InputArea>

      {isVideoLoading && (
        <div style={{ padding: '10px', background: 'rgba(244, 67, 54, 0.2)', fontSize: '0.8rem', color: '#ffcdd2', textAlign: 'center' }}>
          Generating talking avatar video...
        </div>
      )}

      {videoUrl && (
        <div style={{ position: 'absolute', top: '0', left: '-360px', width: '350px', background: '#000', borderRadius: '15px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: '#fff' }}>HeyGen Avatar</span>
            <button onClick={() => setVideoUrl(null)} style={{ color: '#fff', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          <video src={videoUrl} autoPlay controls style={{ width: '100%' }} />
        </div>
      )}
    </ChatContainer>
  );
};

export default ChatInterface;
