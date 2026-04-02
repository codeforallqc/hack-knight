import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';         
import Schedule from './pages/SchedulePage';   
import Sponsors from './pages/SponsorsPage';

export default function App(){
  return (
    <BrowserRouter>
      <Navbar />                           
      
      <Routes>                        
        <Route path="/" element={<Home />} />             
        <Route path="/schedule" element={<Schedule />} />  
        <Route path="/sponsors" element={<Sponsors />} />  
      </Routes>

      <Footer />                    
    </BrowserRouter>
  )
}