import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar, { SIDEBAR_COLLAPSED_WIDTH } from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export const AdminLayout: React.FC = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AdminSidebar />
      <div style={{ marginLeft: SIDEBAR_COLLAPSED_WIDTH }}>
        <AdminTopBar />
        <div style={{ background: '#F7FAFC', minHeight: 'calc(100vh - 54px)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
