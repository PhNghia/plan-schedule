import './App.css';
import { useState } from 'react'
import Schedule from '../src/components/Schedule'

function App() {

  const [comparing, setComparing] = useState(false)

  return (
    <div>
      {comparing || <Schedule />}

      {/* {comparing || <button onClick={() => setComparing(true)}>So sánh thời khóa biểu</button>}
      {comparing && <button onClick={() => setComparing(false)}>Tạo thời khóa biểu</button>} */}
    </div>
  );
}

export default App;
