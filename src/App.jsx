import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Archive from './pages/Archive.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import Post from './pages/Post.jsx';
import Tags from './pages/Tags.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="posts/:slug" element={<Post />} />
        <Route path="tags" element={<Tags />} />
        <Route path="archive" element={<Archive />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
