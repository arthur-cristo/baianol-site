import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Exemplos from "./components/Exemplos";
import Playground from "./components/Playground";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/exemplos" element={<Exemplos />} />
      <Route path="/playground" element={<Playground />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;