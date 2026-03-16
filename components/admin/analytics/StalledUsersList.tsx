import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { StalledUser } from '../../../lib/analytics';
import AdminCard from '../AdminCard';

interface StalledUsersListProps {
  users: StalledUser[];
  orgId: string;
  totalStalled?: number;
}

const StalledUsersList: React.FC<StalledUsersListProps> = ({ users, orgId, totalStalled }) => {
  const navigate = useNavigate();

  return (
    <AdminCard padding="20px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>
            Stalled Users
          </span>
          {users.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#718096',
              background: '#EDF2F7', padding: '2px 8px', borderRadius: 10,
            }}>
              {totalStalled || users.length} users inactive 14+ days
            </span>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 18, marginRight: 6 }}>&#10003;</span>
          <span style={{ fontSize: 13, color: '#48BB78' }}>
            No stalled users — everyone has been active in the last 14 days.
          </span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            display: 'flex', padding: '8px 0', borderBottom: '1px solid #EDF2F7',
            fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <span style={{ flex: 2 }}>Name</span>
            <span style={{ flex: 1 }}>Current Level</span>
            <span style={{ flex: 1 }}>Last Active</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Days Inactive</span>
          </div>

          {/* Rows */}
          {users.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid #F7FAFC', fontSize: 12,
            }}>
              <span style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#EDF2F7', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#4A5568',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontWeight: 500, color: '#1A202C' }}>{user.name}</span>
              </span>
              <span style={{ flex: 1 }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                  fontSize: 11, fontWeight: 600, background: '#EDF2F7', color: '#4A5568',
                }}>
                  L{user.currentLevel}
                </span>
              </span>
              <span style={{ flex: 1, color: '#718096' }}>
                {user.lastActive
                  ? `${user.daysInactive}d ago`
                  : '—'}
              </span>
              <span style={{
                flex: 1, textAlign: 'right', fontWeight: 600,
                color: user.daysInactive >= 30 ? '#E53E3E' : '#ECC94B',
              }}>
                {user.daysInactive}
              </span>
            </div>
          ))}

          {(totalStalled || 0) > 10 && (
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <a
                href={`/admin/organisations/${orgId}?tab=users`}
                onClick={e => { e.preventDefault(); navigate(`/admin/organisations/${orgId}?tab=users`); }}
                style={{ fontSize: 12, fontWeight: 600, color: '#38B2AC', textDecoration: 'none' }}
              >
                View all stalled users →
              </a>
            </div>
          )}
        </>
      )}
    </AdminCard>
  );
};

export default StalledUsersList;
