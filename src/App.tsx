import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Exemplos from "./components/Exemplos";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/exemplos" element={<Exemplos />} />
    </Routes>
  );
}

export default App;