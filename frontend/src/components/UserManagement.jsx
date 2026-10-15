import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getStoredToken } from '../utils/auth';
const API_BASE = 'http://localhost:8085';
const normalizeUser = (raw) => {
    var _a, _b;
    return ({
        id: raw.id,
        name: raw.name || '',
        email: raw.email || '',
        role: raw.role || 'USER',
        isVerified: Boolean((_b = (_a = raw.isVerified) !== null && _a !== void 0 ? _a : raw.verified) !== null && _b !== void 0 ? _b : false),
        isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : raw.active !== undefined ? Boolean(raw.active) : true,
        createdAt: raw.createdAt || '',
    });
};
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [togglingUserId, setTogglingUserId] = useState(null);
    useEffect(() => {
        fetchUsers();
    }, []);
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getStoredToken();
            const response = await axios.get(`${API_BASE}/api/admin/user-management`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                const normalized = response.data.users.map(normalizeUser);
                setUsers(normalized);
            }
            else {
                setError('Failed to fetch users');
            }
        }
        catch {
            setError('Error fetching users');
        }
        finally {
            setLoading(false);
        }
    };
    const showSuccessPopup = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };
    const toggleUserStatus = async (userId, activate) => {
        var _a, _b;
        const targetUser = users.find((u) => u.id === userId);
        if ((targetUser === null || targetUser === void 0 ? void 0 : targetUser.role) === 'ADMIN') {
            setError('Admin accounts cannot be deactivated');
            setTimeout(() => setError(null), 3000);
            return;
        }
        try {
            setTogglingUserId(userId);
            setError(null);
            const token = getStoredToken();
            const endpoint = activate
                ? `${API_BASE}/api/admin/user-management/${userId}/activate`
                : `${API_BASE}/api/admin/user-management/${userId}/deactivate`;
            setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? { ...u, isActive: activate } : u)));
            const response = await axios.post(endpoint, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                showSuccessPopup(activate ? 'User activated successfully' : 'account is deactivated successful');
                if (response.data.user) {
                    const updated = normalizeUser(response.data.user);
                    setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? updated : u)));
                }
            }
            else {
                setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? { ...u, isActive: !activate } : u)));
                setError(response.data.message || 'Failed to update user status');
            }
        }
        catch (err) {
            setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? { ...u, isActive: !activate } : u)));
            const message = axios.isAxiosError(err) && ((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message)
                ? String(err.response.data.message)
                : 'Error updating user status';
            setError(message);
        }
        finally {
            setTogglingUserId(null);
        }
    };
    const getStatusIcon = (isVerified) => {
        if (isVerified) {
            return (<span title="Email verified" style={{ color: '#28a745', fontSize: '22px', fontWeight: 'bold' }}>
          ✓
        </span>);
        }
        return (<span title="Email not verified" style={{ color: '#dc3545', fontSize: '22px', fontWeight: 'bold' }}>
        ✗
      </span>);
    };
    const getRoleBadge = (role) => {
        const colors = {
            ADMIN: '#dc3545',
            USER: '#007bff',
        };
        return (<span style={{
                backgroundColor: colors[role] || '#6c757d',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
            }}>
        {role}
      </span>);
    };
    if (loading) {
        return (<div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading users...</div>
      </div>);
    }
    return (<div style={{ padding: '20px', position: 'relative' }}>
      <h2>User Management</h2>

      {successMessage && (<div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 9999,
                backgroundColor: '#28a745',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                fontWeight: '600',
                fontSize: '15px',
                animation: 'fadeIn 0.2s ease-in',
            }}>
          {successMessage}
        </div>)}

      {error && (<div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
            }}>
          {error}
        </div>)}

      <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
        }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Verified</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (<tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusIcon(user.isVerified)}</td>
                <td style={{ padding: '12px' }}>{user.name}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>{getRoleBadge(user.role)}</td>
                <td style={{ padding: '12px' }}>
                  {user.isVerified ? (<span style={{ color: '#28a745' }}>Verified</span>) : (<span style={{ color: '#ffc107' }}>Not Verified</span>)}
                </td>
                <td style={{ padding: '12px' }}>
                  {user.role === 'ADMIN' ? (<span style={{ color: '#6c757d', fontSize: '13px' }}>—</span>) : user.isActive ? (<button onClick={() => toggleUserStatus(user.id, false)} disabled={togglingUserId === user.id} style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: togglingUserId === user.id ? 'wait' : 'pointer',
                    fontSize: '14px',
                    opacity: togglingUserId === user.id ? 0.7 : 1,
                }}>
                      {togglingUserId === user.id ? 'Processing...' : 'Deactivate'}
                    </button>) : (<button onClick={() => toggleUserStatus(user.id, true)} disabled={togglingUserId === user.id} style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: togglingUserId === user.id ? 'wait' : 'pointer',
                    fontSize: '14px',
                    opacity: togglingUserId === user.id ? 0.7 : 1,
                }}>
                      {togglingUserId === user.id ? 'Processing...' : 'Activate'}
                    </button>)}
                </td>
              </tr>))}
          </tbody>
        </table>

        {users.length === 0 && (<div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No users found
          </div>)}
      </div>
    </div>);
};
export default UserManagement;
