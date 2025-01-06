import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Todologin from './pages/Todologin/Todologin'; // Adjust the path as needed
import Todoregister from './pages/Todoregister/Todoregister'; // Adjust the path as needed
import Todopage from './pages/Todopage/Todopage';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Todologin />} />
        <Route path="/register" element={<Todoregister />} />
        <Route path="/page" element={<Todopage />} />
      </Routes>
    </Router>
  );
};

export default App;