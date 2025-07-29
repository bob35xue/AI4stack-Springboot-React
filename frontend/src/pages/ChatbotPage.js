import React, { useState } from 'react';
import apiClient from '../api';

const ChatbotPage = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Sending query:', query);
      const response = await apiClient.post('/issues/classify', { query: query });

      // Add the new message to the chat history
      setMessages([...messages, {
        query: query,
        response: response.data.response,
        productCode: response.data.product_code,
        productName: response.data.product_name,
        issueId: response.data.issue_id,
        confidence: response.data.confidence,
        isUnanswered: response.data.is_unanswered
      }]);

      // Clear the input field
      setQuery('');
    } catch (error) {
      console.error('Failed to send query:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        let errorMessage = 'An error occurred.';
        if (status === 401) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (status === 500) {
          errorMessage = data?.message || data?.detail || 'An internal server error occurred. Please check the server logs.';
        } else {
          errorMessage = data?.detail || data?.message || `Request failed with status code ${status}.`;
        }
        setError(errorMessage);
      } else if (error.request) {
        setError('Network error. Could not connect to the server.');
      } else {
        setError(`An unexpected error occurred: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '20px'
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            marginBottom: '10px', 
            backgroundColor: msg.isUnanswered ? '#fff8e6' : 'transparent',
            padding: '10px',
            borderRadius: '8px'
          }}>
            <p style={{ fontWeight: 'bold' }}>You: {msg.query}</p>
            <p>Bot: {msg.response}</p>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              {msg.productName && (
                <p>Product: {msg.productName} (Code: {msg.productCode})</p>
              )}
              {msg.confidence !== undefined && (
                <p>Confidence: {(msg.confidence * 100).toFixed(1)}%</p>
              )}
              {msg.isUnanswered && (
                <p style={{ color: '#ff9800' }}>
                  An admin will review this question soon.
                </p>
              )}
            </div>
          </div>
        ))}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '10px',
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '10px'
      }}>
        <input
          type="text"
          value={query}
          disabled={isLoading}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your message..."
          style={{
            backgroundColor: isLoading ? '#f0f0f0' : 'white',
            flex: 1,
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
        <button 
          disabled={isLoading}
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatbotPage;