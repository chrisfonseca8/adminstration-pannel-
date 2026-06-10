import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

const RoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const loadRoom = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await axios.get(`${API_BASE}/rooms/${roomId}`, {
                    withCredentials: true,
                });

                setRoom(response.data.data);
                setMembers(response.data.data.Room_details || []);

                const dashboardRes = await axios.get(`${API_BASE}/dashboard`, {
                    withCredentials: true,
                });

                const dashData = dashboardRes.data;
                const isAdmin = dashData.room_detailsObj?.adminRooms?.some(r => r.room_id === parseInt(roomId));
                setUserRole(isAdmin ? 'admin' : 'member');
            } catch (error) {
                const message = error?.response?.data?.message || 'Unable to load room';
                setError(message);
                if (error?.response?.status === 401) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        loadRoom();
    }, [roomId, navigate]);

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Remove this member from the room?')) return;

        try {
            await axios.delete(`${API_BASE}/room-members/${memberId}`, {
                withCredentials: true,
            });

            setMembers(members.filter(m => m.id !== memberId));
        } catch (error) {
            alert(error?.response?.data?.message || 'Failed to remove member');
        }
    };

    const handleLeaveRoom = async () => {
        if (!window.confirm('Leave this room?')) return;

        try {
            const roomDetail = members.find(m => m.user_id !== room.admin);
            if (roomDetail) {
                await axios.delete(`${API_BASE}/room-members/${roomDetail.id}`, {
                    withCredentials: true,
                });
            }
            navigate('/dashboard');
        } catch (error) {
            alert(error?.response?.data?.message || 'Failed to leave room');
        }
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm('Delete this room? This action cannot be undone.')) return;

        try {
            await axios.delete(`${API_BASE}/rooms/${roomId}`, {
                withCredentials: true,
            });
            navigate('/dashboard');
        } catch (error) {
            alert(error?.response?.data?.message || 'Failed to delete room');
        }
    };

    if (loading) {
        return <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>Loading room...</div>;
    }

    if (error) {
        return (
            <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
                <h1>Error</h1>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={() => navigate('/dashboard')}>Back to dashboard</button>
            </div>
        );
    }

    if (!room) {
        return <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>Room not found</div>;
    }

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 960 }}>
            <header style={{ marginBottom: 24 }}>
                <button onClick={() => navigate('/dashboard')} style={{ marginBottom: 12 }}>← Back to dashboard</button>
                <h1>{room.name}</h1>
                <p style={{ color: '#666' }}>ID: {room.id}</p>
            </header>

            <section style={{ marginBottom: 24, padding: 18, border: '1px solid #ddd', borderRadius: 8 }}>
                <h2>Members ({members.length})</h2>
                {members.length === 0 ? (
                    <p>No members yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ddd' }}>
                                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                                <th style={{ textAlign: 'left', padding: 8 }}>Role</th>
                                {userRole === 'admin' && <th style={{ textAlign: 'center', padding: 8 }}>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: 8 }}>{member.User?.email || 'Unknown'}</td>
                                    <td style={{ padding: 8 }}>
                                        {member.role === 'ADMIN' ? (
                                            <span style={{ background: '#fff3cd', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                                                👑 Admin
                                            </span>
                                        ) : (
                                            <span>Member</span>
                                        )}
                                    </td>
                                    {userRole === 'admin' && (
                                        <td style={{ textAlign: 'center', padding: 8 }}>
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                style={{ background: '#ffcccc', padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                {userRole === 'admin' ? (
                    <button
                        onClick={handleDeleteRoom}
                        style={{ background: '#ff6b6b', color: 'white', padding: '10px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                        Delete room
                    </button>
                ) : (
                    <button
                        onClick={handleLeaveRoom}
                        style={{ background: '#eee', padding: '10px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        Leave room
                    </button>
                )}
            </section>
        </div>
    );
};

export default RoomPage;
