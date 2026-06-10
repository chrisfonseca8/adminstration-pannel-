import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoomCard = ({ room, isAdmin, onNavigate }) => (
    <div
        onClick={() => onNavigate(room.room_id)}
        style={{
            padding: 16,
            border: '1px solid #ccc',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: '#f9f9f9',
            position: 'relative',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
        {isAdmin && (
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 18,
                    title: 'You are an admin',
                }}
            >
                👑
            </div>
        )}
        <h4 style={{ margin: '0 0 8px 0' }}>{room.room_name}</h4>
        <p style={{ margin: 0, color: '#666', fontSize: 12 }}>ID: {room.room_id}</p>
    </div>
);

const Dashboard = ({ dashboardData, onLogout }) => {
    const navigate = useNavigate();
    const userObj = dashboardData?.userObj ?? {};
    const roomDetails = dashboardData?.room_detailsObj ?? {};
    const adminRooms = roomDetails.adminRooms ?? [];
    const joinedRooms = roomDetails.joinedRooms ?? [];

    const handleExportData = () => {
        const payload = {
            user: userObj,
            rooms: roomDetails,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${userObj.username || userObj.email || 'user'}-data.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRoomClick = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 1024 }}>
            <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome, <strong>{userObj.username || userObj.email || 'User'}</strong>.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleExportData}>Export data</button>
                    <button onClick={onLogout} style={{ background: '#eee' }}>
                        Log out
                    </button>
                </div>
            </header>

            <section style={{ marginBottom: 24, padding: 18, border: '1px solid #ddd', borderRadius: 8 }}>
                <h2>Your profile</h2>
                <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
                    <div><strong>Username:</strong> {userObj.username || 'Not available'}</div>
                    <div><strong>Email:</strong> {userObj.email || 'Not available'}</div>
                </div>
            </section>

            <section style={{ marginBottom: 24 }}>
                <h2>Admin rooms ({adminRooms.length})</h2>
                {adminRooms.length === 0 ? (
                    <p>No admin rooms.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                        {adminRooms.map((room) => (
                            <RoomCard key={room.room_id} room={room} isAdmin={true} onNavigate={handleRoomClick} />
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginBottom: 24 }}>
                <h2>Joined rooms ({joinedRooms.length})</h2>
                {joinedRooms.length === 0 ? (
                    <p>No joined rooms.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                        {joinedRooms.map((room) => (
                            <RoomCard key={room.room_id} room={room} isAdmin={false} onNavigate={handleRoomClick} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
