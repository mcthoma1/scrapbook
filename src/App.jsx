import React from 'react';
import Layout from '@/Layout';
import { Routes, Route } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Home from '@/pages/Home';
import Albums from '@/pages/Albums';
import AlbumDetail from '@/pages/AlbumDetail';
import CreateMemory from '@/pages/CreateMemory';
import EditMemory from '@/pages/EditMemory';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path={createPageUrl('Home')} element={<Home />} />
        <Route path={createPageUrl('Albums')} element={<Albums />} />
        <Route path={createPageUrl('AlbumDetail')} element={<AlbumDetail />} />
        <Route path={createPageUrl('CreateMemory')} element={<CreateMemory />} />
        <Route path={createPageUrl('EditMemory')} element={<EditMemory />} />
        <Route path={createPageUrl('Profile')} element={<Profile />} />
      </Routes>
    </Layout>
  );
}
