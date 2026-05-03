import './App.css';
import ShiftBlocks from './components/ShiftBlocks';

function App() {
  return (
    <div className="App">
      <ShiftBlocks page={0} limit={20} columns="3" cardLayout="facility" />
    </div>
  );
}

export default App;
