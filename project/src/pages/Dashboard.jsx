import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, TrendingUp, Calendar } from 'lucide-react';
import StatsCard from '../components/UI/StatsCard';
import DataTable from '../components/UI/DataTable';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeScholarships: 0,
    applications: 0,
    thisMonth: 0
  });

  useEffect(() => {
    fetchUsers();
    // You can fetch additional stats here
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token'); // adjust based on auth strategy
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setStats(prev => ({ ...prev, totalUsers: res.data.length }));
     
      
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      render: value => <div className="font-medium text-gray-900">{value}</div>
    },
    {
      key: 'email',
      label: 'Email',
      render: value => <div className="text-gray-600">{value}</div>
    },
    {
      key: 'createdAt',
      label: 'Join Date',
      render: value => (
        <div className="text-gray-500 text-sm">
          {new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      )
    }
  ];

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
    { title: 'Active Scholarships', value: stats.activeScholarships, icon: GraduationCap, color: 'green' },
    { title: 'Applications', value: stats.applications, icon: TrendingUp, color: 'purple' },
    { title: 'This Month', value: stats.thisMonth, icon: Calendar, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <StatsCard
            key={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
          <div className="text-sm text-gray-500">
            Total: {users.length} users
          </div>
        </div>

        <DataTable columns={userColumns} data={users} />
      </div>
    </div>
  );
};

export default Dashboard;
