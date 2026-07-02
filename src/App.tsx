import { Navigate, Route, Routes } from 'react-router-dom'
import { InitialScreen } from './screens/initialScreen/index.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<InitialScreen activeTab="overview" />} />
      <Route path="/games" element={<InitialScreen activeTab="games" />} />
      <Route path="/movies" element={<InitialScreen activeTab="movies" />} />
      <Route path="/books" element={<InitialScreen activeTab="books" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
