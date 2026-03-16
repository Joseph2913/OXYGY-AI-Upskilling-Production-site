import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROUTE_BREADCRUMBS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/organisations': 'Organisations',
  '/admin/organisations/new': 'New Organisation',
  '/admin/users': 'Users',
  '/admin/content': 'Content',
  '/admin/settings': 'Settings',
};

function useBreadcrumbs(): Array<{ label: string; path?: string }> {
  const location = useLocation();
  const params = useParams();
  const path = location.pathname;

  const crumbs: Array<{ label: string; path?: string }> = [
    { label: 'Admin', path: '/admin' },
  ];

  if (path === '/admin') {
    crumbs.push({ label: 'Dashboard' });
    return crumbs;
  }

  if (path.startsWith('/admin/organisations')) {
    crumbs.push({ label: 'Organisations', path: '/admin/organisations' });

    if (path === '/admin/organisations/new') {
      crumbs.push({ label: 'New Organisation' });
    } else if (params.id) {
      // Org detail or edit — use state-passed name or generic label
      const orgName = (location.state as Record<string, string> | null)?.orgName || 'Organisation';
      if (path.endsWith('/edit')) {
        crumbs.push({ label: orgName, path: `/admin/organisations/${params.id}` });
        crumbs.push({ label: 'Edit' });
      } else {
        crumbs.push({ label: orgName });
      }
    }
    return crumbs;
  }

  const label = ROUTE_BREADCRUMBS[path];
  if (label) crumbs.push({ label });

  return crumbs;
}

const AdminTopBar: React.FC = () => {
  const { user } = useAuth();
  const crumbs = useBreadcrumbs();

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Admin';
  const initial = (fullName?.[0] || 'A').toUpperCase();

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 5, height: 54,
      background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      padding: '0 36px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Left — Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <span style={{ color: '#CBD5E0', padding: '0 8px' }}>›</span>
              )}
              {isLast ? (
                <span style={{ color: '#1A202C', fontWeight: 600 }}>{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path || '/admin'}
                  style={{
                    color: '#718096', textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#718096'; }}
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right — Admin user strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#718096' }}>{fullName}</span>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: '#E53E3E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontWeight: 700, fontSize: 13,
        }}>
          {initial}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
