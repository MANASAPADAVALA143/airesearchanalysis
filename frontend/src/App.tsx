import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Build from './pages/Build'
import History from './pages/History'
import Home from './pages/Home'
import Research from './pages/Research'
import Starred from './pages/Starred'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="research" element={<Research />} />
        <Route path="starred" element={<Starred />} />
        <Route path="history" element={<History />} />
        <Route path="build" element={<Build />} />
      </Route>
    </Routes>
  )
}
