import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import UsersTable from '../../components/admin/users/UsersTable';
import InviteUserModal from '../../components/admin/users/InviteUserModal';

const AdminUsers: React.FC = () => {
  const [showInvite, setShowInvite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: 0 }}>Users</h1>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 24,
            border: 'none', background: '#38B2AC', color: '#FFFFFF',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={15} /> Invite User
        </button>
      </div>

      <UsersTable key={refreshKey} />

      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onInvited={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
