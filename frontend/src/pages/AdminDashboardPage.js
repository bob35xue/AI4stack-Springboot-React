import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminDashboardPage = () => {
  const [issues, setIssues] = useState([]);
  const [unknownQueries, setUnknownQueries] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'unknown'
  const [retrainingStatus, setRetrainingStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [currentQuery, setCurrentQuery] = useState(null); // For editing responses
  const [adminResponse, setAdminResponse] = useState('');

  const [catalogOptions, setCatalogOptions] = useState([]);

  const fetchCatalog = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/products');
      setCatalogOptions(response.data);
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
      setError('Failed to load product catalog');
    }
  }, []);

  const fetchIssues = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/issues', {
        params: { query: searchQuery, user_id: selectedUser === '' ? 0 : selectedUser, product_code: selectedCatalog === '' ? 0 : selectedCatalog }
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      setError('Failed to load issues');
    }
  }, [searchQuery, selectedUser, selectedCatalog]);

  const fetchUnknownQueries = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/issues/unknown', {
        params: { resolved: false },
        withCredentials: true
      });
      setUnknownQueries(response.data);
    } catch (error) {
      console.error('Failed to fetch unknown queries:', error);
      setError('Failed to load unknown queries');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchCatalog();
    if (activeTab === 'issues') {
      fetchIssues();
    } else {
      fetchUnknownQueries();
    }
  }, [fetchUsers, fetchCatalog, fetchIssues, fetchUnknownQueries, activeTab]);

  const handleSearch = () => {
    if (selectedUser === '') {
      // Optionally, you can disable the search button instead of showing an error
      return;
    }
    fetchIssues();
  };

  const handleResolveQuery = async (queryId) => {
    if (!adminResponse) {
      setError('Please provide a response');
      return;
    }

    try {
      await axios.put(`http://localhost:8000/issues/unknown/${queryId}`, {
        admin_response: adminResponse
      }, { withCredentials: true });
      
      setMessage('Query resolved successfully');
      setCurrentQuery(null);
      setAdminResponse('');
      fetchUnknownQueries();
    } catch (error) {
      console.error('Failed to resolve query:', error);
      setError('Failed to resolve query');
    }
  };

  const handleRetrainModel = async () => {
    setRetrainingStatus('loading');
    try {
      const response = await axios.post('http://localhost:8000/issues/retrain', {}, 
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setRetrainingStatus('success');
    } catch (error) {
      console.error('Failed to retrain model:', error);
      setError('Failed to retrain model: ' + (error.response?.data?.detail || error.message));
      setRetrainingStatus('error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: 'red', background: '#ffeeee', padding: '10px', borderRadius: '5px' }}>{error}</p>}
      {message && <p style={{ color: 'green', background: '#eeffee', padding: '10px', borderRadius: '5px' }}>{message}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('issues')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: activeTab === 'issues' ? '#007bff' : '#eee',
            color: activeTab === 'issues' ? 'white' : 'black',
            marginRight: '10px',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Customer Issues
        </button>
        <button 
          onClick={() => setActiveTab('unknown')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: activeTab === 'unknown' ? '#007bff' : '#eee',
            color: activeTab === 'unknown' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Unknown Queries
        </button>
      </div>
      
      {activeTab === 'issues' ? (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            
            <select 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
            
            <select 
              onChange={(e) => setSelectedCatalog(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">Select Catalog</option>
              {catalogOptions.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>

            <button 
              onClick={handleSearch}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Search
            </button>
          </div>

          <h2>Customer Issues</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {issues.map(issue => (
              <div key={issue.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: issue.is_unanswered ? '#fff8e6' : 'white'
              }}>
                <p><strong>Issue ID:</strong> {issue.id}</p>
                <p><strong>Query:</strong> {issue.query}</p>
                <p><strong>User ID:</strong> {issue.user_id}</p>
                <p><strong>Product:</strong> {issue.product_name} (Code: {issue.product_code})</p>
                {issue.confidence_score !== undefined && (
                  <p><strong>Confidence:</strong> {(issue.confidence_score * 100).toFixed(1)}%</p>
                )}
                <p><strong>Response:</strong> {issue.response}</p>
                <p><strong>Created:</strong> {new Date(issue.created_at).toLocaleString()}</p>
                {issue.is_unanswered && (
                  <div style={{ 
                    backgroundColor: '#fff8e6', 
                    padding: '5px', 
                    borderRadius: '4px',
                    marginTop: '10px'
                  }}>
                    <p>⚠️ Low confidence classification</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Unknown Queries</h2>
            <button 
              onClick={handleRetrainModel}
              disabled={retrainingStatus === 'loading'}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: retrainingStatus === 'loading' ? '#cccccc' : '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: retrainingStatus === 'loading' ? 'not-allowed' : 'pointer' 
              }}
            >
              {retrainingStatus === 'loading' ? 'Retraining...' : 'Retrain Model'}
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {unknownQueries.map(query => (
              <div key={query.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: currentQuery?.id === query.id ? '#f0f9ff' : 'white'
              }}>
                <p><strong>Query ID:</strong> {query.id}</p>
                <p><strong>Query:</strong> {query.query}</p>
                <p><strong>User ID:</strong> {query.user_id}</p>
                <p><strong>Created:</strong> {new Date(query.created_at).toLocaleString()}</p>
                
                {currentQuery?.id === query.id ? (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Provide Product Category:</strong></p>
                    <select 
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">Select a product category</option>
                      {catalogOptions.map(product => (
                        <option key={product.id} value={product.name}>{product.name}</option>
                      ))}
                    </select>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        onClick={() => handleResolveQuery(query.id)}
                        style={{ 
                          flex: 1,
                          padding: '8px', 
                          backgroundColor: '#4CAF50', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}
                      >
                        Submit
                      </button>
                      <button 
                        onClick={() => {
                          setCurrentQuery(null);
                          setAdminResponse('');
                        }}
                        style={{ 
                          flex: 1,
                          padding: '8px', 
                          backgroundColor: '#f44336', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setCurrentQuery(query);
                      setAdminResponse('');
                    }}
                    style={{ 
                      width: '100%',
                      marginTop: '10px',
                      padding: '8px', 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
            {unknownQueries.length === 0 && (
              <p>No unknown queries requiring attention.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;